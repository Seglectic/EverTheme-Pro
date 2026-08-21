// ╭──────────────────────────────╮
// │  Shareable URL State Tests   │
// │  Guards compact round trips  │
// │  and malformed-link fallback.│
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../defaults";
import { STOCK_MINI_PALETTE } from "../mini/palette";
import { decodeShareState, encodeShareState, type ProShareState, type ShareState } from "./shareState";

const examplePro = (): ProShareState => ({
  settings: {
    ...structuredClone(DEFAULT_SETTINGS),
    name: "Seglectic theme",
    header: { style: 1, x: 15, y: 19, width: 30, height: 1, textX: 0, textY: 0 },
    scrollX: -8,
    scrollY: 7,
  },
  backgroundPresetId: "pluses",
  backgroundColors: { background: "#101010", primary: "#315a84", secondary: "#212918" },
});

describe("shareable URL state", () => {
  it("round-trips the active Pro scene in a short URL-safe payload", () => {
    const state: ShareState = { mode: "pro", pro: examplePro() };
    const encoded = encodeShareState(state);
    expect(encoded).toMatch(/^[\w-]+$/u);
    expect(encoded.length).toBeLessThan(100);
    expect(decodeShareState(encoded)).toEqual(state);
  });

  it("round-trips Mini in less than half the Pro payload", () => {
    const pro = encodeShareState({ mode: "pro", pro: examplePro() });
    const state: ShareState = {
      mode: "mini",
      miniPalette: { ...STOCK_MINI_PALETTE, background: "#293142", romText: "#d6deef" },
    };
    const mini = encodeShareState(state);
    expect(mini.length).toBeLessThan(pro.length / 2);
    expect(decodeShareState(mini)).toEqual(state);
  });

  it("preserves Unicode names without splitting encoded characters", () => {
    const state: ShareState = { mode: "pro", pro: examplePro() };
    state.pro.settings.name = "波のテーマ 🌊";
    const decoded = decodeShareState(encodeShareState(state));
    expect(decoded?.mode).toBe("pro");
    expect(decoded?.mode === "pro" && decoded.pro.settings.name).toBe(state.pro.settings.name);
  });

  it("ignores malformed, incomplete, and future-version payloads", () => {
    expect(decodeShareState("not+url-safe")).toBeUndefined();
    expect(decodeShareState("AQ")).toBeUndefined();
    expect(decodeShareState("AwA")).toBeUndefined();
  });
});
