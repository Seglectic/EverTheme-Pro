// ╭─────────────────────────────╮
// │  BGR Theme Compiler        │
// │  Encodes palettes, fonts, │
// │  maps, and 4bpp GBA tiles. │
// ╰──────────────────────────────╯

import type { CompilerConfig, PixelImage, RegionSettings } from "../types";

type IndexedImage = {
  width: number;
  height: number;
  palette: Uint16Array;
  indices: Uint8Array;
};

const CONFIG_SIZE = 128;
const PALETTE_SIZE = 512;
const FONT_SIZE = 8192;
const BACKGROUND_VRAM = 0x4000;
const BACKGROUND_PALETTE = 15;

const defaultPaletteValues = () => {
  const values = new Uint32Array(256);
  values.set([0x000000, 0x090909, 0x151515], 0);
  values.set([0x000000, 0x090909, 0x1f1f1f], 16);
  values.set([0x000000, 0x090909, 0x1f1f05], 32);
  values.set([0x000000, 0x090909, 0x001f00], 48);
  return values;
};

const write16 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
};

const toBytes16 = (values: Uint16Array) => {
  const bytes = new Uint8Array(values.length * 2);
  for (let index = 0; index < values.length; index += 1) write16(bytes, index * 2, values[index]);
  return bytes;
};

const concatBytes = (...parts: Uint8Array[]) => {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const assertImageSize = (image: PixelImage) => {
  if (image.width > 512 || image.height > 256) throw new Error("Images can be at most 512×256 pixels.");
  if (image.width % 8 !== 0 || image.height % 8 !== 0) {
    throw new Error("Image width and height must be multiples of 8 pixels.");
  }
};

function indexImage(image: PixelImage | undefined, reserveTransparency: boolean): IndexedImage {
  const source = image ?? {
    width: 8,
    height: 8,
    data: new Uint8ClampedArray(8 * 8 * 4),
  };
  assertImageSize(source);

  const colors: number[] = [];
  const tilePixels = new Uint16Array(source.width * source.height);
  let cursor = 0;

  for (let tileY = 0; tileY < source.height; tileY += 8) {
    for (let tileX = 0; tileX < source.width; tileX += 8) {
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const sourceOffset = ((tileY + y) * source.width + tileX + x) * 4;
          const red = source.data[sourceOffset] >> 3;
          const green = source.data[sourceOffset + 1] >> 3;
          const blue = source.data[sourceOffset + 2] >> 3;
          const color = red | (green << 5) | (blue << 10);
          tilePixels[cursor] = color;
          if (!colors.includes(color)) {
            if (colors.length === 16) throw new Error("Images can use no more than 16 colors.");
            colors.push(color);
          }
          cursor += 1;
        }
      }
    }
  }

  if (reserveTransparency && colors.length < 16) colors.unshift(0x8000);
  while (colors.length < 16) colors.push(0);

  const colorToIndex = new Map<number, number>();
  colors.forEach((color, index) => {
    if (!colorToIndex.has(color)) colorToIndex.set(color, index);
  });
  const indices = Uint8Array.from(tilePixels, (color) => colorToIndex.get(color) ?? 0);

  return {
    width: source.width,
    height: source.height,
    palette: Uint16Array.from(colors),
    indices,
  };
}

function resizeTiles(image: IndexedImage, width: number, height: number, wrapX: boolean, wrapY: boolean) {
  const output = new Uint8Array(width * height);
  const sourceColumns = image.width / 8;
  const sourceRows = image.height / 8;
  const targetColumns = width / 8;
  const targetRows = height / 8;

  for (let row = 0; row < targetRows; row += 1) {
    for (let column = 0; column < targetColumns; column += 1) {
      if ((!wrapX && column >= sourceColumns) || (!wrapY && row >= sourceRows)) continue;
      const sourceTile = ((column % sourceColumns) + (row % sourceRows) * sourceColumns) * 64;
      const targetTile = (column + row * targetColumns) * 64;
      output.set(image.indices.subarray(sourceTile, sourceTile + 64), targetTile);
    }
  }

  return { ...image, width, height, indices: output };
}

function dedupeTiles(indices: Uint8Array) {
  const unique: Uint8Array[] = [];
  const map = new Uint16Array(indices.length / 64);

  for (let tileIndex = 0; tileIndex < map.length; tileIndex += 1) {
    const tile = indices.subarray(tileIndex * 64, tileIndex * 64 + 64);
    let match = -1;
    for (let uniqueIndex = 0; uniqueIndex < unique.length; uniqueIndex += 1) {
      const candidate = unique[uniqueIndex];
      let equal = true;
      for (let pixel = 0; pixel < 64; pixel += 1) {
        if (candidate[pixel] !== tile[pixel]) {
          equal = false;
          break;
        }
      }
      if (equal) {
        match = uniqueIndex;
        break;
      }
    }
    if (match < 0) {
      match = unique.length;
      unique.push(tile.slice());
    }
    map[tileIndex] = match;
  }

  const pixels = new Uint8Array(unique.length * 64);
  unique.forEach((tile, index) => pixels.set(tile, index * 64));
  return { map, pixels };
}

function pack4bpp(indices: Uint8Array) {
  const output = new Uint8Array(indices.length / 2);
  for (let index = 0; index < indices.length; index += 2) {
    output[index / 2] = (indices[index] & 0x0f) | ((indices[index + 1] & 0x0f) << 4);
  }
  return output;
}

function makeFont(fontSource: PixelImage) {
  if (fontSource.width !== 128 || fontSource.height !== 64) {
    throw new Error("Font sheets must be exactly 128×64 pixels.");
  }
  const font = indexImage(fontSource, false);

  for (let index = 0; index < font.indices.length; index += 1) {
    if (font.indices[index] >= 1) font.indices[index] = (font.indices[index] + 1) % 16;
  }
  const shifted = font.palette.slice();
  for (let index = 1; index < 16; index += 1) font.palette[(index + 1) % 16] = shifted[index];
  font.indices.fill(0, 0, 64);

  const packed = pack4bpp(font.indices);
  const output = new Uint8Array(FONT_SIZE);
  output.set(packed, 0);
  output.set(packed, 4096);
  for (let index = 0; index < 4096; index += 1) {
    if ((packed[index] & 0xf0) === 0) output[index + 4096] |= 0x10;
    if ((packed[index] & 0x0f) === 0) output[index + 4096] |= 0x01;
  }
  return output;
}

function makeBackground(source: PixelImage | undefined, scrollXEnabled: boolean, scrollYEnabled: boolean) {
  let image = indexImage(source, true);
  const width = scrollXEnabled ? 512 : 240;
  const height = scrollYEnabled ? 256 : 160;
  image = resizeTiles(image, width, height, scrollXEnabled, scrollYEnabled);

  const { map, pixels } = dedupeTiles(image.indices);
  const packedTiles = pack4bpp(pixels);
  if (packedTiles.length > 32768) throw new Error(`Final image is too complex (${packedTiles.length} bytes).`);

  const tileBase = ((BACKGROUND_VRAM / 32) % 256) + (BACKGROUND_PALETTE << 12);
  for (let index = 0; index < map.length; index += 1) map[index] += tileBase;

  const paletteBytes = toBytes16(image.palette);
  const mapBytes = toBytes16(map);
  const header = new Uint8Array(32);
  header[0] = width / 8;
  header[1] = height / 8;
  header[4] = BACKGROUND_PALETTE * 16;
  header[5] = paletteBytes.length / 2;
  write16(header, 6, 32);
  write16(header, 8, 32 + paletteBytes.length);
  write16(header, 10, 32 + paletteBytes.length + mapBytes.length);
  write16(header, 12, packedTiles.length / 32);
  write16(header, 14, BACKGROUND_VRAM);

  return {
    bytes: concatBytes(header, paletteBytes, mapBytes, packedTiles),
    palette: image.palette,
  };
}

const regionBytes = (region: RegionSettings) => [
  region.style,
  region.x,
  region.y,
  region.width,
  region.height,
  region.textX,
  region.textY,
  0,
];

const paletteRegister = (index: number) => ((index & 0x0f) << 12) | ((index & 0x10) << 4);

function makeConfig(config: CompilerConfig, size: number, paletteOffset: number, fontOffset: number, imageOffset: number) {
  const output = new Uint8Array(CONFIG_SIZE);
  write16(output, 0, 0xed24);
  write16(output, 2, size);
  write16(output, 4, paletteOffset);
  write16(output, 6, fontOffset);
  write16(output, 8, imageOffset);
  output[10] = config.scrollXEnabled ?? config.scrollX !== 0 ? 1 : 0;
  output[11] = config.scrollYEnabled ?? config.scrollY !== 0 ? 1 : 0;
  output[12] = config.scrollX & 0xff;
  output[13] = config.scrollY & 0xff;
  output.set(regionBytes(config.header), 14);
  output.set(regionBytes(config.footer), 22);
  output.set(regionBytes(config.files), 30);

  const registers = [
    config.header.palette,
    config.footer.palette,
    config.files.backgroundPalette,
    config.files.filePalette,
    config.files.directoryPalette,
    config.files.selectionPalette,
    config.files.borderPalette,
    ...config.menuPalettes,
  ];
  registers.forEach((value, index) => write16(output, 38 + index * 2, paletteRegister(value)));
  return output;
}

function makePalettes(config: CompilerConfig, backgroundPalette: Uint16Array) {
  const source = defaultPaletteValues();
  config.palettes.slice(0, 16).forEach((palette, paletteIndex) => {
    palette.slice(0, 16).forEach((color, colorIndex) => {
      source[paletteIndex * 16 + colorIndex] = color;
    });
  });

  const output = new Uint16Array(256);
  for (let index = 0; index < source.length; index += 1) {
    const color = source[index];
    output[index] = ((color >>> 16) & 0x1f) | (((color >>> 8) & 0x1f) << 5) | ((color & 0x1f) << 10);
  }

  if (!config.useManualBackgroundPalette) output.set(backgroundPalette, 240);
  if (config.background && backgroundPalette[0] !== 0x8000) {
    output[0] = config.useManualBackgroundPalette ? output[240] : backgroundPalette[0];
  }
  return toBytes16(output);
}

export function compileTheme(config: CompilerConfig) {
  const font = makeFont(config.font);
  const background = makeBackground(
    config.background,
    config.scrollXEnabled ?? config.scrollX !== 0,
    config.scrollYEnabled ?? config.scrollY !== 0,
  );
  const palettes = makePalettes(config, background.palette);
  const paletteOffset = CONFIG_SIZE;
  const fontOffset = paletteOffset + PALETTE_SIZE;
  const imageOffset = fontOffset + FONT_SIZE;
  const totalSize = imageOffset + background.bytes.length;

  if (totalSize > 0xffff) throw new Error("Theme exceeds the 65,535-byte format limit.");
  const header = makeConfig(config, totalSize, paletteOffset, fontOffset, imageOffset);
  return concatBytes(header, palettes, font, background.bytes);
}

export function parseOfficialConfig(text: string): Omit<CompilerConfig, "font" | "background"> {
  const values = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const equals = line.indexOf("=");
    if (equals > 0 && !line.startsWith("#")) values.set(line.slice(0, equals).trim(), line.slice(equals + 1).trim());
  }
  const number = (key: string, fallback: number) => {
    const raw = values.get(key);
    return raw === undefined ? fallback : Number.parseInt(raw, raw.toLowerCase().startsWith("0x") ? 16 : 10);
  };
  const region = (prefix: "hdr" | "foot" | "fli", defaults: RegionSettings): RegionSettings => ({
    style: number(`${prefix}_style`, defaults.style) as RegionSettings["style"],
    x: number(`${prefix}_x`, defaults.x),
    y: number(`${prefix}_y`, defaults.y),
    width: number(`${prefix}_w`, defaults.width),
    height: number(`${prefix}_h`, defaults.height),
    textX: number(`${prefix}_bx`, defaults.textX),
    textY: number(`${prefix}_by`, defaults.textY),
  });
  const palettes = Array.from({ length: 16 }, (_, paletteIndex) => {
    const raw = values.get(`palette${paletteIndex}`);
    if (!raw) return Array<number>(16).fill(0);
    const parsed = raw.replace(/[{}\s]/g, "").split(",").map((color) => Number.parseInt(color.replace(/^0x/i, ""), 16));
    return [...parsed, ...Array<number>(16).fill(0)].slice(0, 16);
  });

  return {
    header: { ...region("hdr", { style: 3, x: 0, y: 0, width: 30, height: 1, textX: 0, textY: 0 }), palette: number("hdr_pal", 0x11) },
    footer: { ...region("foot", { style: 3, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 }), palette: number("foot_pal", 0x11) },
    files: {
      ...region("fli", { style: 1, x: 0, y: 2, width: 30, height: 15, textX: 0, textY: 0 }),
      backgroundPalette: number("fli_pal_bg", 0),
      filePalette: number("fli_pal_file", 0),
      directoryPalette: number("fli_pal_dir", 2),
      selectionPalette: number("fli_pal_sel", 0x11),
      borderPalette: number("fli_pal_border", 0),
    },
    menuPalettes: [
      number("menu_pal_box", 0x10),
      number("menu_pal_sel", 0x12),
      number("menu_pal_txt", 0x10),
      number("menu_pal_inf", 0x12),
      number("menu_pal_msg", 0x11),
      number("menu_pal_hdr", 0x11),
      number("menu_pal_foot", 0x11),
    ],
    scrollX: number("scroll_h", 0),
    scrollY: number("scroll_v", 0),
    scrollXEnabled: values.has("scroll_h"),
    scrollYEnabled: values.has("scroll_v"),
    palettes,
    useManualBackgroundPalette: values.has("palette15"),
  };
}
