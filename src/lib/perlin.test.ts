// ╭──────────────────────────────╮
// │  Perlin Noise Tests          │
// │  Guards seeded output and    │
// │  local signal continuity.    │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { createPerlinNoise1D } from "./perlin";

describe("createPerlinNoise1D", () => {
  it("repeats the same signal for the same seed", () => {
    const first = createPerlinNoise1D(0xc0ffee);
    const second = createPerlinNoise1D(0xc0ffee);
    const positions = [0.17, 0.83, 1.42, 7.91, 24.6];

    expect(positions.map(first)).toEqual(positions.map(second));
  });

  it("stays bounded and continuous between lattice points", () => {
    const noise = createPerlinNoise1D(42);
    const samples = Array.from({ length: 1001 }, (_, index) => noise(index / 100));
    const largestStep = Math.max(...samples.slice(1).map((value, index) => Math.abs(value - samples[index])));

    expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(1);
    expect(largestStep).toBeLessThan(0.05);
    expect(samples.some((value) => value !== 0)).toBe(true);
  });
});
