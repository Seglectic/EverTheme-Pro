// ╭──────────────────────────────╮
// │  Image Quantization Tests    │
// │  Keeps low-color assets on   │
// │  exact GBA channel values.   │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { quantizeImage } from "./image";

describe("image quantization", () => {
  it("snaps images already below the palette limit to BGR555", () => {
    const image = quantizeImage({
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        0x11, 0x15, 0x10, 0xff,
        0xd4, 0x53, 0x1a, 0xff,
      ]),
    });

    expect(Array.from(image.data)).toEqual([
      0x10, 0x10, 0x10, 0xff,
      0xd6, 0x52, 0x18, 0xff,
    ]);
  });
});
