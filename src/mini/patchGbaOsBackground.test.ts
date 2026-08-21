// ╭───────────────────────────╮
// │  Mini BG Patcher Tests   │
// │  Locks guarded code and │
// │  full-ROM asset writes. │
// ╰───────────────────────────╯

import { describe, expect, it } from "vitest";
import {
  MINI_BACKGROUND_MAP_BYTES,
  MINI_BACKGROUND_PALETTE_BYTES,
  MINI_BACKGROUND_TILE_BYTES,
  type MiniBackgroundAssets,
} from "./miniBackground";
import {
  buildMiniBackgroundRoutine,
  GBAOS_PATCHED_RELOCATION_END_OFFSET,
  GBAOS_RELOCATION_LITERAL_OFFSET,
  GBAOS_STOCK_RELOCATION_END_OFFSET,
  MINI_BACKGROUND_CODE_END,
  MINI_BACKGROUND_CODE_OFFSET,
  MINI_BACKGROUND_HOOK_OFFSET,
  MINI_BACKGROUND_MAP_OFFSET,
  MINI_BACKGROUND_PALETTE_OFFSET,
  MINI_BACKGROUND_TILE_OFFSET,
  patchGbaOsBackground,
} from "./patchGbaOsBackground";
import { GBAOS_ROM_SIZE } from "./romIdentity";

const stockRom = () => {
  const bytes = new Uint8Array(GBAOS_ROM_SIZE);
  bytes.set([0x70, 0xbc, 0x01, 0xbc, 0x00, 0x47], MINI_BACKGROUND_HOOK_OFFSET);
  bytes.set([0x8c, 0xfc, 0x00, 0x02], GBAOS_RELOCATION_LITERAL_OFFSET);
  return bytes;
};

const assets = (): MiniBackgroundAssets => ({
  tiles: new Uint8Array(MINI_BACKGROUND_TILE_BYTES).fill(0x12),
  map: new Uint8Array(MINI_BACKGROUND_MAP_BYTES).fill(0x34),
  palette: new Uint8Array(MINI_BACKGROUND_PALETTE_BYTES).fill(0x56),
  colorCount: 15,
});

const read32 = (bytes: Uint8Array, offset: number) => (
  bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
) >>> 0;

describe("patchGbaOsBackground", () => {
  it("injects the BG1 picture without mutating its source", () => {
    const source = stockRom();
    const payload = assets();
    const result = patchGbaOsBackground(source, payload);

    expect(result.bytes).not.toBe(source);
    expect(source.slice(MINI_BACKGROUND_CODE_OFFSET).every((value) => value === 0)).toBe(true);
    expect(Array.from(result.bytes.slice(MINI_BACKGROUND_HOOK_OFFSET, MINI_BACKGROUND_HOOK_OFFSET + 6))).toEqual([0x07, 0xf0, 0x00, 0xf9, 0x70, 0xbd]);
    expect(result.bytes.slice(MINI_BACKGROUND_CODE_OFFSET, MINI_BACKGROUND_CODE_OFFSET + buildMiniBackgroundRoutine().length)).toEqual(buildMiniBackgroundRoutine());
    expect(MINI_BACKGROUND_CODE_OFFSET + buildMiniBackgroundRoutine().length).toBeLessThanOrEqual(MINI_BACKGROUND_CODE_END);
    expect(MINI_BACKGROUND_CODE_END).toBeLessThanOrEqual(GBAOS_STOCK_RELOCATION_END_OFFSET);
    expect(read32(result.bytes, GBAOS_RELOCATION_LITERAL_OFFSET)).toBe(0x02020000);
    expect(result.bytes.slice(MINI_BACKGROUND_TILE_OFFSET, MINI_BACKGROUND_MAP_OFFSET)).toEqual(payload.tiles);
    expect(result.bytes.slice(MINI_BACKGROUND_MAP_OFFSET, MINI_BACKGROUND_PALETTE_OFFSET)).toEqual(payload.map);
    expect(result.bytes.slice(MINI_BACKGROUND_PALETTE_OFFSET, MINI_BACKGROUND_PALETTE_OFFSET + 32)).toEqual(payload.palette);
    expect(result.assetBytes).toBe(18_464);
  });

  it("copies the picture payload and enables BG1 behind BG0", () => {
    const routine = buildMiniBackgroundRoutine();
    expect(Array.from({ length: 13 }, (_, index) => read32(routine, 40 + index * 4))).toEqual([
      0x0200fd00, 0x06008000, 0x00001000,
      0x02013d00, 0x0600f800, 0x00000200,
      0x02014500, 0x050001e0, 0x00000008,
      0x04000000, 0x00000300,
      0x0400000a, 0x00001f09,
    ]);
    expect(MINI_BACKGROUND_PALETTE_OFFSET + 32).toBeLessThanOrEqual(GBAOS_PATCHED_RELOCATION_END_OFFSET);
  });

  it("refuses modified hooks, relocation limits, occupied tails, or malformed assets", () => {
    const modifiedHook = stockRom();
    modifiedHook[MINI_BACKGROUND_HOOK_OFFSET] = 0;
    expect(() => patchGbaOsBackground(modifiedHook, assets())).toThrow("initializer epilogue");

    const modifiedRelocation = stockRom();
    modifiedRelocation[GBAOS_RELOCATION_LITERAL_OFFSET] = 0;
    expect(() => patchGbaOsBackground(modifiedRelocation, assets())).toThrow("cartridge relocation limit");

    const occupiedTail = stockRom();
    occupiedTail[MINI_BACKGROUND_TILE_OFFSET + 12] = 1;
    expect(() => patchGbaOsBackground(occupiedTail, assets())).toThrow("extended tile asset is occupied");

    const malformed = assets();
    malformed.map = new Uint8Array(4);
    expect(() => patchGbaOsBackground(stockRom(), malformed)).toThrow("invalid tile, map, or palette dimensions");
  });
});
