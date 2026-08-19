// ╭──────────────────────────────╮
// │  Theme Palette Tests         │
// │  Guards preset completeness  │
// │  and custom-color detection. │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { matchingPalettePreset, PALETTE_PRESETS } from "./palettePresets";

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
});
