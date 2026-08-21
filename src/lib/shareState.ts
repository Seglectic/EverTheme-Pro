// ╭──────────────────────────────╮
// │  Shareable URL State         │
// │  Packs the active build scene│
// │  into a compact URL payload. │
// ╰──────────────────────────────╯

import {
  BACKGROUND_PRESETS,
  type BackgroundPresetColors,
  type BackgroundPresetId,
} from "./backgroundPresets";
import { bgr555ToHex, rgb888ToBgr555 } from "./gbaColor";
import type { MiniPalette, MiniPaletteRole } from "../mini/palette";
import type { BarStyle, RegionSettings, ThemeColors, ThemeRegion, ThemeSettings } from "../types";

const FORMAT_VERSION = 2;
const MAX_NAME_BYTES = 255;
const REGION_ORDER: ThemeRegion[] = ["header", "files", "footer"];
const REGION_KEYS: Array<keyof RegionSettings> = ["style", "x", "y", "width", "height", "textX", "textY"];
const BAR_STYLES: BarStyle[] = [0, 1, 3, 9, 13];
const THEME_COLOR_ORDER: Array<keyof ThemeColors> = [
  "background",
  "chrome",
  "text",
  "directory",
  "selection",
  "selectionText",
];
const MINI_COLOR_ORDER: MiniPaletteRole[] = [
  "background",
  "basicText",
  "romText",
  "folderText",
  "menuHeader",
  "menuChrome",
];

export type ProShareState = {
  settings: ThemeSettings;
  backgroundPresetId: BackgroundPresetId;
  backgroundColors: BackgroundPresetColors;
};

export type ShareState =
  | { mode: "pro"; pro: ProShareState }
  | { mode: "mini"; miniPalette: MiniPalette };

class ByteWriter {
  readonly bytes: number[] = [];

  byte(value: number) {
    this.bytes.push(Math.min(255, Math.max(0, Math.round(value))));
  }

  signedByte(value: number) {
    this.byte(Math.min(127, Math.max(-128, Math.round(value))) & 0xff);
  }

  word(value: number) {
    this.byte(value & 0xff);
    this.byte((value >>> 8) & 0xff);
  }
}

class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  byte() {
    if (this.offset >= this.bytes.length) throw new Error("Incomplete shared state.");
    return this.bytes[this.offset++];
  }

  signedByte() {
    const value = this.byte();
    return value > 127 ? value - 256 : value;
  }

  word() {
    return this.byte() | (this.byte() << 8);
  }

  take(length: number) {
    if (length < 0 || this.offset + length > this.bytes.length) throw new Error("Incomplete shared state.");
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  get complete() {
    return this.offset === this.bytes.length;
  }
}

const encodeBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};

const decodeBase64Url = (value: string) => {
  if (!/^[\w-]+$/u.test(value)) throw new Error("Invalid shared state.");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const compactName = (name: string) => {
  const encoder = new TextEncoder();
  let output = "";
  for (const character of name) {
    if (encoder.encode(output + character).length > MAX_NAME_BYTES) break;
    output += character;
  }
  return encoder.encode(output);
};

const writeColor = (writer: ByteWriter, color: string) => writer.word(rgb888ToBgr555(color));
const readColor = (reader: ByteReader) => bgr555ToHex(reader.word());

const writeRegion = (writer: ByteWriter, region: RegionSettings) => {
  for (const key of REGION_KEYS) {
    writer.byte(key === "style" ? BAR_STYLES.indexOf(region.style) : region[key]);
  }
};

const readRegion = (reader: ByteReader): RegionSettings => {
  const style = BAR_STYLES[reader.byte()];
  if (style === undefined) throw new Error("Invalid shared region style.");
  return {
    style,
    x: reader.byte(),
    y: reader.byte(),
    width: reader.byte(),
    height: reader.byte(),
    textX: reader.byte(),
    textY: reader.byte(),
  };
};

export const encodeShareState = (state: ShareState) => {
  const writer = new ByteWriter();
  writer.byte(FORMAT_VERSION);
  writer.byte(state.mode === "mini" ? 1 : 0);

  if (state.mode === "mini") {
    for (const role of MINI_COLOR_ORDER) writeColor(writer, state.miniPalette[role]);
    return encodeBase64Url(Uint8Array.from(writer.bytes));
  }

  const name = compactName(state.pro.settings.name);
  writer.byte(name.length);
  writer.bytes.push(...name);
  for (const region of REGION_ORDER) writeRegion(writer, state.pro.settings[region]);
  writer.signedByte(state.pro.settings.scrollX);
  writer.signedByte(state.pro.settings.scrollY);
  for (const role of THEME_COLOR_ORDER) writeColor(writer, state.pro.settings.colors[role]);

  const presetIndex = BACKGROUND_PRESETS.findIndex((preset) => preset.id === state.pro.backgroundPresetId);
  if (presetIndex < 0) throw new Error(`Unknown background preset: ${state.pro.backgroundPresetId}`);
  writer.byte(presetIndex);
  writeColor(writer, state.pro.backgroundColors.background);
  writeColor(writer, state.pro.backgroundColors.primary);
  writeColor(writer, state.pro.backgroundColors.secondary ?? state.pro.backgroundColors.primary);

  return encodeBase64Url(Uint8Array.from(writer.bytes));
};

export const decodeShareState = (value: string | null | undefined): ShareState | undefined => {
  if (!value) return undefined;
  try {
    const reader = new ByteReader(decodeBase64Url(value));
    if (reader.byte() !== FORMAT_VERSION) return undefined;
    const modeByte = reader.byte();
    if (modeByte > 1) return undefined;
    if (modeByte === 1) {
      const miniPalette = Object.fromEntries(MINI_COLOR_ORDER.map((role) => [role, readColor(reader)])) as MiniPalette;
      return reader.complete ? { mode: "mini", miniPalette } : undefined;
    }

    const name = new TextDecoder("utf-8", { fatal: true }).decode(reader.take(reader.byte()));
    const regions = Object.fromEntries(REGION_ORDER.map((region) => [region, readRegion(reader)])) as Record<ThemeRegion, RegionSettings>;
    const scrollX = reader.signedByte();
    const scrollY = reader.signedByte();
    const colors = Object.fromEntries(THEME_COLOR_ORDER.map((role) => [role, readColor(reader)])) as ThemeColors;
    const preset = BACKGROUND_PRESETS[reader.byte()];
    if (!preset) return undefined;
    const background = readColor(reader);
    const primary = readColor(reader);
    const secondary = readColor(reader);
    if (!reader.complete) return undefined;

    return {
      mode: "pro",
      pro: {
        settings: { name, ...regions, scrollX, scrollY, colors },
        backgroundPresetId: preset.id,
        backgroundColors: {
          background,
          primary,
          ...(preset.defaultColors.secondary ? { secondary } : {}),
        },
      },
    };
  } catch {
    return undefined;
  }
};
