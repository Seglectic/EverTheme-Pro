// ╭──────────────────────────────╮
// │  Theme Palette Tests         │
// │  Guards preset completeness  │
// │  and custom-color detection. │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import {
  matchingPalettePreset,
  palettePreset,
  PALETTE_PRESETS,
  SEGLECTIC_THEME_PRESET,
} from "./palettePresets";

describe("theme palette presets", () => {
  it("keeps the editor defaults mapped to EverTheme", () => {
    expect(matchingPalettePreset(DEFAULT_SETTINGS.colors)?.id).toBe("evertheme");
  });

  it("provides six valid GBA color roles per preset", () => {
    for (const preset of PALETTE_PRESETS) {
      expect(Object.keys(preset.colors), preset.label).toHaveLength(6);
      for (const color of Object.values(preset.colors)) expect(color, preset.label).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("treats manual color edits as a custom palette", () => {
    expect(matchingPalettePreset({ ...DEFAULT_SETTINGS.colors, text: "#ffffff" })).toBeUndefined();
  });

  it("keeps the coordinated Seglectic theme values exact", () => {
    expect(palettePreset("seglectic").colors).toEqual({
      background: "#111510",
      chrome: "#29362a",
      text: "#ffffff",
      directory: "#d4531a",
      selection: "#ffbe6f",
      selectionText: "#152015",
    });
    expect(SEGLECTIC_THEME_PRESET.regions).toEqual({
      header: { style: 1, x: 15, y: 19, width: 24, height: 1, textX: 0, textY: 0 },
      files: { style: 9, x: 0, y: 0, width: 30, height: 18, textX: 0, textY: 0 },
      footer: { style: 1, x: 0, y: 18, width: 23, height: 2, textX: 0, textY: 0 },
    });
    expect(SEGLECTIC_THEME_PRESET.background).toEqual({
      id: "pluses",
      colors: { primary: "#365880", secondary: "#22291d", background: "#10140f" },
    });
  });

  it("keeps every debug mapping visually distinct and GBA-aligned", () => {
    const colors = Object.values(palettePreset("debug").colors);
    expect(new Set(colors).size).toBe(6);
    for (const color of colors) {
      const value = Number.parseInt(color.slice(1), 16);
      expect((value >>> 16) & 7).toBe(0);
      expect((value >>> 8) & 7).toBe(0);
      expect(value & 7).toBe(0);
    }
  });
});
