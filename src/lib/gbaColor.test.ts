// ╭──────────────────────────────╮
// │  GBA Color Model Tests       │
// │  Locks BGR555 snapping and   │
// │  contrast calculations.      │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { contrastRatio, gbaChannelsToHex, hexToGbaChannels, quantizeGbaColor } from "./gbaColor";

describe("GBA color model", () => {
  it("round-trips exact five-bit channel values", () => {
    expect(hexToGbaChannels("#d4531a")).toEqual({ red: 26, green: 10, blue: 3 });
    expect(gbaChannelsToHex({ red: 26, green: 10, blue: 3 })).toBe("#d65218");
    expect(quantizeGbaColor("#d4531a")).toBe("#d65218");
  });

  it("reports standard display contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1);
  });
});
