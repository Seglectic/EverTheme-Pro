// ╭─────────────────────────────╮
// │  Compiler Compatibility   │
// │  Compares browser output │
// │  with official fixtures. │
// ╰─────────────────────────────╯

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { PixelImage } from "../types";
import { compileTheme, parseOfficialConfig } from "./gbatheme";

const vendorRoot = resolve(process.cwd(), "vendor/gbatheme");

const readPng = (path: string): PixelImage => {
  const image = PNG.sync.read(readFileSync(path));
  return {
    width: image.width,
    height: image.height,
    data: new Uint8ClampedArray(image.data),
  };
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
