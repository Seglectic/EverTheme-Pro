// ╭──────────────────────────────╮
// │  Mini Background Patcher   │
// │  Extends relocation and   │
// │  installs a BG1 picture.  │
// ╰──────────────────────────────╯

import { GBAOS_ROM_SIZE, SUPPORTED_GBAOS_VERSION } from "./romIdentity";
import {
  MINI_BACKGROUND_MAP_BYTES,
  MINI_BACKGROUND_PALETTE_BYTES,
  MINI_BACKGROUND_TILE_BYTES,
  type MiniBackgroundAssets,
} from "./miniBackground";

export const MINI_BACKGROUND_HOOK_OFFSET = 0x774c;
export const MINI_BACKGROUND_CODE_OFFSET = 0xe950;
export const MINI_BACKGROUND_CODE_END = 0xea28;
export const GBAOS_RELOCATION_LITERAL_OFFSET = 0x01bc;
export const GBAOS_STOCK_RELOCATION_END_OFFSET = 0xfc8c;
export const GBAOS_PATCHED_RELOCATION_END_OFFSET = GBAOS_ROM_SIZE;
export const MINI_BACKGROUND_TILE_OFFSET = 0xfd00;
export const MINI_BACKGROUND_MAP_OFFSET = 0x13d00;
export const MINI_BACKGROUND_PALETTE_OFFSET = 0x14500;

const GBAOS_EWRAM_BASE = 0x02000000;
const STOCK_EPILOGUE = Uint8Array.of(0x70, 0xbc, 0x01, 0xbc, 0x00, 0x47);
const STOCK_RELOCATION_END = Uint8Array.of(0x8c, 0xfc, 0x00, 0x02);

export type MiniBackgroundPatch = {
  version: typeof SUPPORTED_GBAOS_VERSION;
  bytes: Uint8Array;
  codeBytes: number;
  assetBytes: number;
  offsets: readonly number[];
};

const write16 = (bytes: Uint8Array, offset: number, value: number) => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = value >> 8;
};

const write32 = (bytes: Uint8Array, offset: number, value: number) => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = value >>> 8;
  bytes[offset + 2] = value >>> 16;
  bytes[offset + 3] = value >>> 24;
};

const thumbLiteralLoad = (register: number, instructionAddress: number, literalAddress: number) => {
  const pc = (instructionAddress + 4) & ~3;
  const distance = literalAddress - pc;
  if (distance < 0 || distance % 4 !== 0 || distance / 4 > 0xff) throw new Error("Thumb literal is out of range.");
  return 0x4800 | (register << 8) | (distance / 4);
};

const thumbBranchLink = (instructionAddress: number, targetAddress: number) => {
  const distance = targetAddress - (instructionAddress + 4);
  if (distance % 2 !== 0 || distance < -0x400000 || distance > 0x3ffffe) throw new Error("Thumb branch is out of range.");
  return [0xf000 | ((distance >> 12) & 0x7ff), 0xf800 | ((distance >> 1) & 0x7ff)] as const;
};

export const buildMiniBackgroundRoutine = () => {
  const codeAddress = GBAOS_EWRAM_BASE + MINI_BACKGROUND_CODE_OFFSET;
  const literalOffset = 40;
  const values = [
    GBAOS_EWRAM_BASE + MINI_BACKGROUND_TILE_OFFSET, 0x06008000, 0x00001000,
    GBAOS_EWRAM_BASE + MINI_BACKGROUND_MAP_OFFSET, 0x0600f800, 0x00000200,
    GBAOS_EWRAM_BASE + MINI_BACKGROUND_PALETTE_OFFSET, 0x050001e0, 0x00000008,
    0x04000000, 0x00000300,
    0x0400000a, 0x00001f09,
  ];
  const bytes = new Uint8Array(literalOffset + values.length * 4);
  const instruction = (offset: number, value: number) => write16(bytes, offset, value);
  const load = (offset: number, register: number, literal: number) => instruction(
    offset,
    thumbLiteralLoad(register, codeAddress + offset, codeAddress + literalOffset + literal * 4),
  );

  load(0, 0, 0); load(2, 1, 1); load(4, 2, 2); instruction(6, 0xdf0c);
  load(8, 0, 3); load(10, 1, 4); load(12, 2, 5); instruction(14, 0xdf0c);
  load(16, 0, 6); load(18, 1, 7); load(20, 2, 8); instruction(22, 0xdf0c);
  load(24, 0, 9); load(26, 1, 10); instruction(28, 0x8001);
  load(30, 0, 11); load(32, 1, 12); instruction(34, 0x8001);
  instruction(36, 0x4770); instruction(38, 0x46c0);
  values.forEach((value, index) => write32(bytes, literalOffset + index * 4, value));
  return bytes;
};

const assertBytes = (source: Uint8Array, offset: number, expected: Uint8Array, label: string) => {
  if (expected.some((value, index) => source[offset + index] !== value)) {
    throw new Error(`Mini background patch refused: ${label} does not match stock v1.17.`);
  }
};

const assertZeroRange = (source: Uint8Array, start: number, end: number, label: string) => {
  for (let offset = start; offset < end; offset += 1) {
    if (source[offset] !== 0) {
      throw new Error(`Mini background patch refused: ${label} is occupied at 0x${offset.toString(16).toUpperCase()}.`);
    }
  }
};

const assertAssetSizes = (assets: MiniBackgroundAssets) => {
  if (assets.tiles.length !== MINI_BACKGROUND_TILE_BYTES
    || assets.map.length !== MINI_BACKGROUND_MAP_BYTES
    || assets.palette.length !== MINI_BACKGROUND_PALETTE_BYTES) {
    throw new Error("Mini background assets have invalid tile, map, or palette dimensions.");
  }
};

export const patchGbaOsBackground = (source: Uint8Array, assets: MiniBackgroundAssets): MiniBackgroundPatch => {
  if (source.length !== GBAOS_ROM_SIZE) throw new Error("Mini background patch requires a 131,072-byte stock v1.17 ROM.");
  assertAssetSizes(assets);
  assertBytes(source, MINI_BACKGROUND_HOOK_OFFSET, STOCK_EPILOGUE, "initializer epilogue");
  assertBytes(source, GBAOS_RELOCATION_LITERAL_OFFSET, STOCK_RELOCATION_END, "cartridge relocation limit");

  const code = buildMiniBackgroundRoutine();
  if (MINI_BACKGROUND_CODE_OFFSET + code.length > MINI_BACKGROUND_CODE_END) {
    throw new Error("Mini background routine exceeds its relocated code cave.");
  }
  if (MINI_BACKGROUND_CODE_END > GBAOS_STOCK_RELOCATION_END_OFFSET) {
    throw new Error("Mini background code cave exceeds the stock GBAOS relocation boundary.");
  }
  if (MINI_BACKGROUND_TILE_OFFSET + assets.tiles.length !== MINI_BACKGROUND_MAP_OFFSET
    || MINI_BACKGROUND_MAP_OFFSET + assets.map.length !== MINI_BACKGROUND_PALETTE_OFFSET
    || MINI_BACKGROUND_PALETTE_OFFSET + assets.palette.length > GBAOS_PATCHED_RELOCATION_END_OFFSET) {
    throw new Error("Mini background assets exceed the extended GBAOS relocation range.");
  }

  // Code must survive the stock copy before its guarded limit can expose the larger tail payload.
  assertZeroRange(source, MINI_BACKGROUND_CODE_OFFSET, MINI_BACKGROUND_CODE_OFFSET + code.length, "relocated code cave");
  assertZeroRange(source, MINI_BACKGROUND_TILE_OFFSET, MINI_BACKGROUND_TILE_OFFSET + assets.tiles.length, "extended tile asset");
  assertZeroRange(source, MINI_BACKGROUND_MAP_OFFSET, MINI_BACKGROUND_MAP_OFFSET + assets.map.length, "extended map asset");
  assertZeroRange(source, MINI_BACKGROUND_PALETTE_OFFSET, MINI_BACKGROUND_PALETTE_OFFSET + assets.palette.length, "extended palette asset");

  const bytes = source.slice();
  const [branchHigh, branchLow] = thumbBranchLink(
    GBAOS_EWRAM_BASE + MINI_BACKGROUND_HOOK_OFFSET,
    GBAOS_EWRAM_BASE + MINI_BACKGROUND_CODE_OFFSET,
  );
  write16(bytes, MINI_BACKGROUND_HOOK_OFFSET, branchHigh);
  write16(bytes, MINI_BACKGROUND_HOOK_OFFSET + 2, branchLow);
  write16(bytes, MINI_BACKGROUND_HOOK_OFFSET + 4, 0xbd70);
  write32(bytes, GBAOS_RELOCATION_LITERAL_OFFSET, GBAOS_EWRAM_BASE + GBAOS_PATCHED_RELOCATION_END_OFFSET);
  bytes.set(code, MINI_BACKGROUND_CODE_OFFSET);
  bytes.set(assets.tiles, MINI_BACKGROUND_TILE_OFFSET);
  bytes.set(assets.map, MINI_BACKGROUND_MAP_OFFSET);
  bytes.set(assets.palette, MINI_BACKGROUND_PALETTE_OFFSET);

  return {
    version: SUPPORTED_GBAOS_VERSION,
    bytes,
    codeBytes: code.length + STOCK_EPILOGUE.length,
    assetBytes: assets.tiles.length + assets.map.length + assets.palette.length,
    offsets: [
      GBAOS_RELOCATION_LITERAL_OFFSET,
      MINI_BACKGROUND_HOOK_OFFSET,
      MINI_BACKGROUND_CODE_OFFSET,
      MINI_BACKGROUND_TILE_OFFSET,
      MINI_BACKGROUND_MAP_OFFSET,
      MINI_BACKGROUND_PALETTE_OFFSET,
    ],
  };
};
