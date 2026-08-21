// ╭──────────────────────────────╮
// │  Mini ROM Patcher Tests      │
// │  Locks quantization, guards, │
// │  and exact output bytes.     │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { GBAOS_ROM_SIZE } from "./romIdentity";
import { matchingMiniPalettePreset, miniPalettePreset, STOCK_MINI_PALETTE } from "./palette";
import { bgr555ToHex, quantizeGbaColor, rgb888ToBgr555 } from "../lib/gbaColor";
import {
  MINI_PALETTE_WRITES,
  patchGbaOsPalette,
} from "./patchGbaOs";

const stockRom = () => {
  const bytes = new Uint8Array(GBAOS_ROM_SIZE);
  for (const write of MINI_PALETTE_WRITES) bytes.set(write.expected, write.offset);
  return bytes;
};

describe("Mini BGR555 colors", () => {
  it("packs RGB channels in GBA order and expands the quantized preview", () => {
    expect(rgb888ToBgr555("#ff0000")).toBe(0x001f);
    expect(rgb888ToBgr555("#00ff00")).toBe(0x03e0);
    expect(rgb888ToBgr555("#0000ff")).toBe(0x7c00);
    expect(bgr555ToHex(0x27bd)).toBe("#efef4a");
    expect(quantizeGbaColor("#d4531a")).toBe("#d65218");
  });

  it("rejects malformed CSS colors", () => {
    expect(() => rgb888ToBgr555("orange")).toThrow("Invalid color");
  });

  it("keeps quantized named presets identifiable", () => {
    const debug = miniPalettePreset("debug");
    expect(matchingMiniPalettePreset(debug.colors)?.id).toBe("debug");
  });
});

describe("patchGbaOsPalette", () => {
  it("leaves stock output byte-identical while returning a new buffer", () => {
    const source = stockRom();
    const result = patchGbaOsPalette(source, STOCK_MINI_PALETTE);
    expect(result.bytes).not.toBe(source);
    expect(result.bytes).toEqual(source);
    expect(result.version).toBe("1.17");
    expect(result.changes).toEqual([]);
  });

  it("writes exact little-endian bytes without mutating the source", () => {
    const source = stockRom();
    const result = patchGbaOsPalette(source, { ...STOCK_MINI_PALETTE, folderText: "#d4531a" });
    const write = MINI_PALETTE_WRITES.find((candidate) => candidate.role === "folderText")!;

    expect(Array.from(result.bytes.slice(write.offset, write.offset + 2))).toEqual([0x5a, 0x0d]);
    expect(Array.from(source.slice(write.offset, write.offset + 2))).toEqual(write.expected);
    expect(result.bytesChanged).toBe(2);
    expect(result.changes[0]).toMatchObject({ role: "folderText", offset: 0x77a8, color: "#d65218" });
  });

  it("refuses a wrong-sized ROM", () => {
    expect(() => patchGbaOsPalette(new Uint8Array(64), STOCK_MINI_PALETTE)).toThrow("Refusing to patch");
  });

  it("refuses a ROM whose guarded preimage has changed", () => {
    const source = stockRom();
    source[0x77b0] = 0;
    expect(() => patchGbaOsPalette(source, STOCK_MINI_PALETTE)).toThrow("0x77B0");
  });
});
