// ╭─────────────────────────────╮
// │  Compiler Compatibility   │
// │  Compares browser output │
// │  with official fixtures. │
// ╰─────────────────────────────╯

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, settingsToCompilerConfig } from "../defaults";
import type { PixelImage } from "../types";
import { compileTheme } from "./gbatheme";
import { parseOfficialConfig } from "./officialConfig";

const vendorRoot = resolve(process.cwd(), "vendor/gbatheme");

const readPng = (path: string): PixelImage => {
  const image = PNG.sync.read(readFileSync(path));
  return {
    width: image.width,
    height: image.height,
    data: new Uint8ClampedArray(image.data),
  };
};

const read16 = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8);

const packedGbaColor = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = ((value >>> 16) & 0xff) >>> 3;
  const green = ((value >>> 8) & 0xff) >>> 3;
  const blue = (value & 0xff) >>> 3;
  return red | (green << 5) | (blue << 10);
};

describe("BGR compiler", () => {
  for (const fixture of ["240p", "9999", "basic1", "basic2", "default", "sorage", "squares", "terminal"]) {
    it(`matches the official ${fixture} output byte for byte`, () => {
      const directory = resolve(vendorRoot, fixture);
      const text = readFileSync(resolve(directory, "cfg.txt"), "utf8");
      const config = parseOfficialConfig(text);
      const font = readPng(resolve(directory, "font.png"));
      const background = text.includes("tset=") ? readPng(resolve(directory, "tileset.png")) : undefined;
      const actual = compileTheme({ ...config, font, background });
      const expected = readFileSync(resolve(directory, `${fixture}.bgr`));
      const firstDifference = actual.findIndex((value, index) => value !== expected[index]);
      expect(
        Buffer.from(actual).equals(expected),
        `first difference at ${firstDifference}; actual size ${actual.length}, expected ${expected.length}`,
      ).toBe(true);
    });
  }
});

describe("editor palette mapping", () => {
  it("keeps folder and selected text in distinct exported palette slots", () => {
    const font: PixelImage = {
      width: 128,
      height: 64,
      data: new Uint8ClampedArray(128 * 64 * 4),
    };
    const output = compileTheme(settingsToCompilerConfig(DEFAULT_SETTINGS, font));
    const paletteOffset = read16(output, 4);
    const paletteColor = (palette: number, color: number) => read16(output, paletteOffset + (palette * 16 + color) * 2);

    expect(read16(output, 46)).toBe(0x2000);
    expect(read16(output, 48)).toBe(0x3100);
    expect(paletteColor(2, 2)).toBe(packedGbaColor(DEFAULT_SETTINGS.colors.directory));
    expect(paletteColor(3, 1)).toBe(packedGbaColor(DEFAULT_SETTINGS.colors.selection));
    expect(paletteColor(3, 2)).toBe(packedGbaColor(DEFAULT_SETTINGS.colors.selectionText));
    expect(paletteColor(3, 2)).not.toBe(paletteColor(2, 2));
  });
});
