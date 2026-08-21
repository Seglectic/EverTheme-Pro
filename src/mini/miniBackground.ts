// ╭──────────────────────────────╮
// │  Mini Background Encoder   │
// │  Packs a browser image as  │
// │  GBA 4bpp tiles and map.   │
// ╰──────────────────────────────╯

import type { PixelImage } from "../types";
import { rgb888ToBgr555 } from "../lib/gbaColor";

export const MINI_BACKGROUND_WIDTH = 224;
export const MINI_BACKGROUND_HEIGHT = 144;
export const MINI_BACKGROUND_TILE_BYTES = 16_384;
export const MINI_BACKGROUND_MAP_BYTES = 2_048;
export const MINI_BACKGROUND_PALETTE_BYTES = 32;

export type MiniBackgroundAssets = {
  tiles: Uint8Array;
  map: Uint8Array;
  palette: Uint8Array;
  colorCount: number;
};

export const encodeMiniSolidBackground = (color: string): MiniBackgroundAssets => {
  const tiles = new Uint8Array(MINI_BACKGROUND_TILE_BYTES);
  const map = new Uint8Array(MINI_BACKGROUND_MAP_BYTES);
  const palette = new Uint8Array(MINI_BACKGROUND_PALETTE_BYTES);
  const word = rgb888ToBgr555(color);

  tiles.fill(0x11, 32, 64);
  for (let tileY = 0; tileY < 20; tileY += 1) {
    for (let tileX = 0; tileX < 30; tileX += 1) {
      const mapOffset = (tileY * 32 + tileX) * 2;
      map[mapOffset] = 0x01;
      map[mapOffset + 1] = 0xf0;
    }
  }
  palette[2] = word & 0xff;
  palette[3] = word >> 8;

  return { tiles, map, palette, colorCount: 1 };
};

const pixelWord = (image: PixelImage, x: number, y: number) => {
  const offset = (y * image.width + x) * 4;
  return (image.data[offset] >> 3)
    | ((image.data[offset + 1] >> 3) << 5)
    | ((image.data[offset + 2] >> 3) << 10);
};

export const encodeMiniBackground = (image: PixelImage): MiniBackgroundAssets => {
  if (image.width !== MINI_BACKGROUND_WIDTH || image.height !== MINI_BACKGROUND_HEIGHT) {
    throw new Error(`Mini backgrounds must be ${MINI_BACKGROUND_WIDTH}×${MINI_BACKGROUND_HEIGHT} pixels.`);
  }

  const paletteWords: number[] = [];
  const paletteIndices = new Map<number, number>();
  const colorIndex = (word: number) => {
    const existing = paletteIndices.get(word);
    if (existing) return existing;
    if (paletteWords.length >= 15) throw new Error("Mini backgrounds are limited to 15 colors.");
    paletteWords.push(word);
    const index = paletteWords.length;
    paletteIndices.set(word, index);
    return index;
  };

  const tiles = new Uint8Array(MINI_BACKGROUND_TILE_BYTES);
  const map = new Uint8Array(MINI_BACKGROUND_MAP_BYTES);
  const palette = new Uint8Array(MINI_BACKGROUND_PALETTE_BYTES);
  let tileIndex = 1;

  for (let tileY = 0; tileY < MINI_BACKGROUND_HEIGHT / 8; tileY += 1) {
    for (let tileX = 0; tileX < MINI_BACKGROUND_WIDTH / 8; tileX += 1) {
      const tileOffset = tileIndex * 32;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 2) {
          const first = colorIndex(pixelWord(image, tileX * 8 + x, tileY * 8 + y));
          const second = colorIndex(pixelWord(image, tileX * 8 + x + 1, tileY * 8 + y));
          tiles[tileOffset + y * 4 + x / 2] = first | (second << 4);
        }
      }

      // One transparent tile around the 28×18 image centers it in the 30×20 GBA viewport.
      const mapIndex = (tileY + 1) * 32 + tileX + 1;
      const entry = 0xf000 | tileIndex;
      map[mapIndex * 2] = entry & 0xff;
      map[mapIndex * 2 + 1] = entry >> 8;
      tileIndex += 1;
    }
  }

  paletteWords.forEach((word, index) => {
    palette[(index + 1) * 2] = word & 0xff;
    palette[(index + 1) * 2 + 1] = word >> 8;
  });

  return { tiles, map, palette, colorCount: paletteWords.length };
};
