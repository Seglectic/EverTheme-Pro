// ╭──────────────────────────────╮
// │  Background Preset Tests     │
// │  Guards GBA image limits and │
// │  randomized default behavior.│
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, settingsToCompilerConfig } from "../defaults";
import type { PixelImage } from "../types";
import {
  BACKGROUND_PRESETS,
  backgroundPreset,
  generateBackgroundPreset,
  generateSolidBackground,
  randomBackgroundMotion,
  randomBackgroundPreset,
} from "./backgroundPresets";
import { compileTheme } from "./gbatheme";

const blankFont: PixelImage = {
  width: 128,
  height: 64,
  data: new Uint8ClampedArray(128 * 64 * 4),
};

describe("background presets", () => {
  it("keeps every pattern tile-aligned and within the 15-color image limit", () => {
    for (const preset of BACKGROUND_PRESETS) {
      const image = generateBackgroundPreset(preset);
      const colors = new Set<string>();
      for (let offset = 0; offset < image.data.length; offset += 4) {
        colors.add(`${image.data[offset]},${image.data[offset + 1]},${image.data[offset + 2]}`);
      }
      expect(image.width % 8, preset.label).toBe(0);
      expect(image.height % 8, preset.label).toBe(0);
      expect(512 % image.width, `${preset.label} horizontal wrap`).toBe(0);
      expect(256 % image.height, `${preset.label} vertical wrap`).toBe(0);
      expect(colors.size, preset.label).toBeLessThanOrEqual(15);
    }
  });

  it("generates pattern pixels from the supplied browser colors", () => {
    const preset = backgroundPreset("pluses");
    const image = generateBackgroundPreset(preset, {
      background: "#000000",
      primary: "#f80000",
      secondary: "#00f800",
    });
    const colors = new Set<string>();
    for (let offset = 0; offset < image.data.length; offset += 4) {
      colors.add(`${image.data[offset]},${image.data[offset + 1]},${image.data[offset + 2]}`);
    }
    expect(colors).toEqual(new Set(["0,0,0", "248,0,0", "0,248,0"]));
    expect(BACKGROUND_PRESETS.filter((candidate) => candidate.defaultColors.secondary).map((candidate) => candidate.id))
      .toEqual(["pluses", "seigaiha"]);
  });

  it("keeps the preferred Micro Check foreground color", () => {
    expect(backgroundPreset("checks").defaultColors.primary).toBe("#31513f");
  });

  it("keeps Solid still and renders exactly one background color", () => {
    const preset = backgroundPreset("solid");
    const image = generateBackgroundPreset(preset, { background: "#102030", primary: "#ffffff" });
    const colors = new Set<string>();
    for (let offset = 0; offset < image.data.length; offset += 4) {
      colors.add(`${image.data[offset]},${image.data[offset + 1]},${image.data[offset + 2]}`);
    }
    expect(colors).toEqual(new Set(["16,32,48"]));
    expect(randomBackgroundMotion(preset, () => 0)).toEqual({ scrollX: 0, scrollY: 0 });
  });

  it("writes the Solid Base color into the exported background palette", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.colors.background = "#102030";
    const output = compileTheme(settingsToCompilerConfig(
      settings,
      blankFont,
      generateSolidBackground(settings.colors.background),
    ));
    const backgroundPaletteColor = 128 + 15 * 16 * 2 + 2;
    expect(Array.from(output.slice(backgroundPaletteColor, backgroundPaletteColor + 2))).toEqual([0x82, 0x18]);
  });

  it("can choose the complete preset range", () => {
    expect(randomBackgroundPreset(() => 0)).toBe(BACKGROUND_PRESETS[0]);
    expect(randomBackgroundPreset(() => 0.999_999)).toBe(BACKGROUND_PRESETS.at(-1));
  });

  it("generates a non-zero motion vector inside the editor grid", () => {
    for (const preset of BACKGROUND_PRESETS) {
      const values = [0, 0];
      const motion = randomBackgroundMotion(preset, () => values.shift() ?? 0);
      expect(Math.abs(motion.scrollX)).toBeLessThanOrEqual(8);
      expect(Math.abs(motion.scrollY)).toBeLessThanOrEqual(8);
      expect(motion.scrollX !== 0 || motion.scrollY !== 0).toBe(preset.id !== "solid");
    }
  });

  it("compiles every pattern with two-axis scrolling", () => {
    for (const preset of BACKGROUND_PRESETS) {
      const settings = structuredClone(DEFAULT_SETTINGS);
      Object.assign(settings, { scrollX: 4, scrollY: -3 });
      const output = compileTheme(settingsToCompilerConfig(settings, blankFont, generateBackgroundPreset(preset)));
      expect(output[0], preset.label).toBe(0x24);
      expect(output[1], preset.label).toBe(0xed);
      expect(output.length, preset.label).toBeLessThanOrEqual(0xffff);
    }
  });
});
