// ╭──────────────────────────────╮
// │  Mini Palette Tests          │
// │  Guards public role names and│
// │  readable preset mappings.   │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { contrastRatio } from "../lib/gbaColor";
import { MINI_PALETTE_LABELS, miniPalettePreset } from "./palette";

describe("Mini palette presets", () => {
  it("uses concise hardware-facing role labels", () => {
    expect(MINI_PALETTE_LABELS).toEqual({
      background: "Background",
      basicText: "Title + Selected Text",
      romText: "ROM Text",
      folderText: "Folder + Popup Text",
      menuHeader: "Popup Selection",
      menuChrome: "Header/Footer Popup Fill",
    });
  });

  it("keeps EverTheme title and selected text readable against its background", () => {
    const colors = miniPalettePreset("evertheme").colors;
    expect(colors.basicText).toBe("#f7f7d6");
    expect(contrastRatio(colors.basicText, colors.background)).toBeGreaterThan(10);
  });
});
