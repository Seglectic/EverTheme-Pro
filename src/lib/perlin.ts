// ╭──────────────────────────────╮
// │  One-Dimensional Perlin      │
// │  Produces seeded coherent    │
// │  noise for motion vectors.   │
// ╰──────────────────────────────╯

const fade = (value: number) => value ** 3 * (value * (value * 6 - 15) + 10);
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPerlinNoise1D(seed: number) {
  const random = createRandom(seed);
  const permutation = Array.from({ length: 256 }, (_, index) => index);

  for (let index = permutation.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [permutation[index], permutation[target]] = [permutation[target], permutation[index]];
  }

  return (position: number) => {
    const cell = Math.floor(position);
    const distance = position - cell;
    const leftGradient = (permutation[cell & 255] & 1) === 0 ? distance : -distance;
    const rightDistance = distance - 1;
    const rightGradient = (permutation[(cell + 1) & 255] & 1) === 0 ? rightDistance : -rightDistance;
    return lerp(leftGradient, rightGradient, fade(distance)) * 2;
  };
}
