// ╭──────────────────────────────╮
// │  Mini ROM Palette Patcher    │
// │  Quantizes colors and guards │
// │  every stock v1.17 write.    │
// ╰──────────────────────────────╯

import { GBAOS_ROM_SIZE, SUPPORTED_GBAOS_VERSION } from "./romIdentity";
import type { MiniPalette, MiniPaletteRole } from "./palette";
import { bgr555ToHex, rgb888ToBgr555 } from "./gbaColor";

type MiniPaletteWrite = {
  role: MiniPaletteRole;
  offset: number;
  expected: readonly [number, number];
};

export type MiniPatchChange = {
  role: MiniPaletteRole;
  offset: number;
  before: readonly [number, number];
  after: readonly [number, number];
  color: string;
};

export type MiniPatchResult = {
  version: typeof SUPPORTED_GBAOS_VERSION;
  bytes: Uint8Array;
  changes: MiniPatchChange[];
  bytesChanged: number;
};

export const MINI_PALETTE_WRITES: readonly MiniPaletteWrite[] = [
  { role: "romText", offset: 0x779c, expected: [0xf7, 0x5e] },
  { role: "folderText", offset: 0x77a8, expected: [0xbd, 0x27] },
  { role: "basicText", offset: 0x77b0, expected: [0xff, 0x7f] },
  { role: "menuChrome", offset: 0x77bc, expected: [0x31, 0x46] },
  { role: "menuHeader", offset: 0x77cc, expected: [0x94, 0x7e] },
];

export const patchGbaOsPalette = (source: Uint8Array, palette: MiniPalette): MiniPatchResult => {
  if (source.length !== GBAOS_ROM_SIZE) {
    throw new Error(`Refusing to patch a ${source.length.toLocaleString()}-byte ROM; stock v1.17 must be 131,072 bytes.`);
  }

  // Assert every preimage before allocating output so partially themed ROMs cannot be repatched accidentally.
  for (const write of MINI_PALETTE_WRITES) {
    if (write.offset + 1 >= source.length) throw new Error(`Palette write at 0x${write.offset.toString(16)} is outside the ROM.`);
    if (source[write.offset] !== write.expected[0] || source[write.offset + 1] !== write.expected[1]) {
      throw new Error(`Stock v1.17 palette bytes do not match at 0x${write.offset.toString(16).toUpperCase()}.`);
    }
  }

  const bytes = source.slice();
  const changes: MiniPatchChange[] = [];

  for (const write of MINI_PALETTE_WRITES) {
    const value = rgb888ToBgr555(palette[write.role]);
    const after = [value & 0xff, value >> 8] as const;
    if (after[0] === write.expected[0] && after[1] === write.expected[1]) continue;
    bytes.set(after, write.offset);
    changes.push({
      role: write.role,
      offset: write.offset,
      before: write.expected,
      after,
      color: bgr555ToHex(value),
    });
  }

  return { version: SUPPORTED_GBAOS_VERSION, bytes, changes, bytesChanged: changes.length * 2 };
};
