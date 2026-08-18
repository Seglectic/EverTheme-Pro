// ╭─────────────────────────────╮
// │  Browser Image Pipeline    │
// │  Decodes, crops, and      │
// │  quantizes dropped assets. │
// ╰─────────────────────────────╯

import type { PixelImage } from "../types";

const FONT_EXTENSIONS = /\.(ttf|otf|woff2?)$/i;

const loadBitmap = async (source: Blob | string) => {
  const blob = typeof source === "string" ? await fetch(source).then((response) => response.blob()) : source;
  return createImageBitmap(blob);
};

const canvasPixels = (bitmap: ImageBitmap, width: number, height: number, fit: "cover" | "stretch") => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser does not support canvas image processing.");
  context.imageSmoothingEnabled = true;

  if (fit === "stretch") {
    context.drawImage(bitmap, 0, 0, width, height);
  } else {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }
  bitmap.close();
  const imageData = context.getImageData(0, 0, width, height);
  return { width, height, data: imageData.data } satisfies PixelImage;
};

type ColorBox = { colors: number[][] };

const channelRange = (box: ColorBox, channel: number) => {
  let min = 255;
  let max = 0;
  for (const color of box.colors) {
    min = Math.min(min, color[channel]);
    max = Math.max(max, color[channel]);
  }
  return max - min;
};

function medianCut(colors: number[][], limit: number) {
  const boxes: ColorBox[] = [{ colors }];
  while (boxes.length < limit) {
    let bestIndex = -1;
    let bestRange = -1;
    let channel = 0;
    boxes.forEach((box, index) => {
      if (box.colors.length < 2) return;
      for (let candidate = 0; candidate < 3; candidate += 1) {
        const range = channelRange(box, candidate);
        if (range > bestRange) {
          bestRange = range;
          bestIndex = index;
          channel = candidate;
        }
      }
    });
    if (bestIndex < 0) break;
    const [box] = boxes.splice(bestIndex, 1);
    box.colors.sort((a, b) => a[channel] - b[channel]);
    const middle = Math.ceil(box.colors.length / 2);
    boxes.push({ colors: box.colors.slice(0, middle) }, { colors: box.colors.slice(middle) });
  }
  return boxes.map((box) => {
    const sum = box.colors.reduce((total, color) => [total[0] + color[0], total[1] + color[1], total[2] + color[2]], [0, 0, 0]);
    return sum.map((value) => Math.round(value / box.colors.length) & 0xf8);
  });
}

export function quantizeImage(image: PixelImage, limit = 15): PixelImage {
  const histogram = new Map<number, number>();
  for (let index = 0; index < image.data.length; index += 4) {
    const key = ((image.data[index] >> 3) << 10) | ((image.data[index + 1] >> 3) << 5) | (image.data[index + 2] >> 3);
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  if (histogram.size <= limit) return image;

  const weightedColors: number[][] = [];
  histogram.forEach((count, key) => {
    const color = [((key >> 10) & 31) << 3, ((key >> 5) & 31) << 3, (key & 31) << 3];
    const weight = Math.max(1, Math.round(Math.sqrt(count)));
    for (let copy = 0; copy < weight; copy += 1) weightedColors.push(color);
  });
  const palette = medianCut(weightedColors, limit);
  const output = new Uint8ClampedArray(image.data.length);

  for (let index = 0; index < image.data.length; index += 4) {
    let best = palette[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const color of palette) {
      const red = image.data[index] - color[0];
      const green = image.data[index + 1] - color[1];
      const blue = image.data[index + 2] - color[2];
      const distance = red * red + green * green + blue * blue;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = color;
      }
    }
    output[index] = best[0];
    output[index + 1] = best[1];
    output[index + 2] = best[2];
    output[index + 3] = 255;
  }
  return { ...image, data: output };
}

export async function prepareBackground(file: File) {
  const bitmap = await loadBitmap(file);
  return quantizeImage(canvasPixels(bitmap, 240, 160, "cover"));
}

export async function loadPixelImage(source: Blob | string, width: number, height: number) {
  const bitmap = await loadBitmap(source);
  return canvasPixels(bitmap, width, height, "stretch");
}

export async function prepareFont(file: File): Promise<PixelImage> {
  if (!FONT_EXTENSIONS.test(file.name)) {
    const bitmap = await loadBitmap(file);
    if (bitmap.width !== 128 || bitmap.height !== 64) {
      bitmap.close();
      throw new Error("Font sheet images must be exactly 128×64 pixels.");
    }
    return quantizeImage(canvasPixels(bitmap, 128, 64, "stretch"), 3);
  }

  const family = `evertheme-${Date.now()}`;
  const face = new FontFace(family, await file.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser does not support font rendering.");
  context.fillStyle = "#000";
  context.fillRect(0, 0, 128, 64);
  context.fillStyle = "#fff";
  context.font = `8px ${family}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let glyph = 0; glyph < 128; glyph += 1) {
    const x = (glyph % 16) * 8 + 4;
    const y = Math.floor(glyph / 16) * 8 + 4;
    context.fillText(String.fromCharCode(glyph + 0x20), x, y);
  }
  document.fonts.delete(face);
  return quantizeImage({ width: 128, height: 64, data: context.getImageData(0, 0, 128, 64).data }, 2);
}

export function pixelImageUrl(image: PixelImage) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser does not support image previews.");
  context.putImageData(new ImageData(Uint8ClampedArray.from(image.data), image.width, image.height), 0, 0);
  return canvas.toDataURL("image/png");
}
