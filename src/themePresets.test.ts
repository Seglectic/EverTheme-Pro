// ╭──────────────────────────────╮
// │  Complete Preset Tests       │
// │  Guards coordinated theme    │
// │  colors, layout and patterns.│
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { themePreset } from "./themePresets";

describe("complete theme presets", () => {
  it("keeps the Seglectic theme values exact and full-width", () => {
    const preset = themePreset("seglectic");

    expect(preset.colors).toEqual({
      background: "#111510",
      chrome: "#29362a",
      text: "#ffffff",
      directory: "#d4531a",
      selection: "#ffbe6f",
      selectionText: "#152015",
    });
    expect(preset.regions).toEqual({
      header: { style: 1, x: 15, y: 19, width: 30, height: 1, textX: 0, textY: 0 },
      files: { style: 9, x: 0, y: 0, width: 30, height: 18, textX: 0, textY: 0 },
      footer: { style: 1, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 },
    });
    expect(preset.background).toEqual({
      id: "pluses",
      colors: { primary: "#365880", secondary: "#22291d", background: "#10140f" },
    });
  });
});
