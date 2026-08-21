// ╭──────────────────────────────╮
// │  Mini Background Tests     │
// │  Locks 4bpp tile, map,    │
// │  palette, and size rules. │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import type { PixelImage } from "../types";
import {
  encodeMiniBackground,
  encodeMiniSolidBackground,
  MINI_BACKGROUND_HEIGHT,
  MINI_BACKGROUND_MAP_BYTES,
  MINI_BACKGROUND_PALETTE_BYTES,
  MINI_BACKGROUND_TILE_BYTES,
  MINI_BACKGROUND_WIDTH,
} from "./miniBackground";

const imageWith = (pixel: (x: number, y: number) => readonly [number, number, number]): PixelImage => {
  const data = new Uint8ClampedArray(MINI_BACKGROUND_WIDTH * MINI_BACKGROUND_HEIGHT * 4);
  for (let y = 0; y < MINI_BACKGROUND_HEIGHT; y += 1) {
    for (let x = 0; x < MINI_BACKGROUND_WIDTH; x += 1) {
      const offset = (y * MINI_BACKGROUND_WIDTH + x) * 4;
      data.set([...pixel(x, y), 255], offset);
    }
  }
  return { width: MINI_BACKGROUND_WIDTH, height: MINI_BACKGROUND_HEIGHT, data };
};

describe("encodeMiniBackground", () => {
  it("centers 504 hardware tiles inside a transparent 32×32 map", () => {
    const assets = encodeMiniBackground(imageWith((x) => x % 2 ? [0, 248, 0] : [248, 0, 0]));

    expect(assets.tiles).toHaveLength(MINI_BACKGROUND_TILE_BYTES);
    expect(assets.map).toHaveLength(MINI_BACKGROUND_MAP_BYTES);
    expect(assets.palette).toHaveLength(MINI_BACKGROUND_PALETTE_BYTES);
    expect(assets.colorCount).toBe(2);
    expect(Array.from(assets.tiles.slice(32, 36))).toEqual([0x21, 0x21, 0x21, 0x21]);
    expect(Array.from(assets.map.slice(66, 68))).toEqual([0x01, 0xf0]);
    expect(Array.from(assets.map.slice(0, 64))).toEqual(new Array(64).fill(0));
  });

  it("rejects wrong dimensions or more than 15 BGR555 colors", () => {
    const wrongSize = imageWith(() => [0, 0, 0]);
    wrongSize.width -= 1;
    expect(() => encodeMiniBackground(wrongSize)).toThrow("224×144");

    const tooMany = imageWith((x) => [(x % 16) * 8, 0, 0]);
    expect(() => encodeMiniBackground(tooMany)).toThrow("15 colors");
  });
});

describe("encodeMiniSolidBackground", () => {
  it("fills the complete native 30×20 viewport with one hardware color", () => {
    const assets = encodeMiniSolidBackground("#31513f");

    expect(assets.colorCount).toBe(1);
    expect(Array.from(assets.tiles.slice(32, 64))).toEqual(new Array(32).fill(0x11));
    expect(Array.from(assets.map.slice(0, 4))).toEqual([0x01, 0xf0, 0x01, 0xf0]);
    expect(Array.from(assets.map.slice((19 * 32 + 29) * 2, (19 * 32 + 30) * 2))).toEqual([0x01, 0xf0]);
    expect(Array.from(assets.map.slice(60, 64))).toEqual([0, 0, 0, 0]);
    expect(Array.from(assets.palette.slice(2, 4))).toEqual([0x46, 0x1d]);
  });
});
