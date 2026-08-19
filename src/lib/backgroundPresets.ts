// ╭──────────────────────────────╮
// │  Built-in Backgrounds        │
// │  Generates compact tiled GBA │
// │  patterns and motion vectors.│
// ╰──────────────────────────────╯

import type { PixelImage } from "../types";

type Rgb = readonly [red: number, green: number, blue: number];

export type BackgroundPresetId = "pluses" | "dots" | "seigaiha" | "checks" | "crisscross";

export type BackgroundPresetColors = {
  background: string;
  primary: string;
  secondary?: string;
};

export type BackgroundPresetColorKey = keyof BackgroundPresetColors;
export type BackgroundPresetColorMap = Record<BackgroundPresetId, BackgroundPresetColors>;

type PatternColors = {
  background: Rgb;
  primary: Rgb;
  secondary: Rgb;
};

export type BackgroundPreset = {
  id: BackgroundPresetId;
  label: string;
  defaultColors: BackgroundPresetColors;
  speed: readonly [minimum: number, maximum: number];
  render: (colors: PatternColors) => PixelImage;
};

const hexToRgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
};

const resolveColors = (colors: BackgroundPresetColors): PatternColors => ({
  background: hexToRgb(colors.background),
  primary: hexToRgb(colors.primary),
  secondary: hexToRgb(colors.secondary ?? colors.primary),
});

const makePattern = (width: number, height: number, colorAt: (x: number, y: number) => Rgb): PixelImage => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [red, green, blue] = colorAt(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = 255;
    }
  }
  return { width, height, data };
};

const pluses = (colors: PatternColors) => makePattern(64, 64, (x, y) => {
  const localX = x % 16;
  const localY = y % 16;
  const isPlus = (localX === 7 && localY >= 5 && localY <= 9) || (localY === 7 && localX >= 5 && localX <= 9);
  if (!isPlus) return colors.background;
  return (Math.floor(x / 16) + Math.floor(y / 16) * 2) % 4 === 0 ? colors.primary : colors.secondary;
});

const dots = (colors: PatternColors) => makePattern(64, 64, (x, y) => {
  const isDot = x % 8 >= 3 && x % 8 <= 4 && y % 8 >= 3 && y % 8 <= 4;
  return isDot ? colors.primary : colors.background;
});

const seigaiha = (colors: PatternColors) => makePattern(64, 64, (x, y) => {
  for (let row = -1; row <= 8; row += 1) {
    const centerY = row * 8 + 7;
    const offsetX = (row & 1) * 8;
    const deltaY = y - centerY;
    if (deltaY > 0 || deltaY < -9) continue;

    for (let column = -2; column <= 5; column += 1) {
      const deltaX = x - (column * 16 + offsetX);
      const radius = Math.hypot(deltaX, deltaY);
      if (Math.abs(radius - 3) <= 0.55 || Math.abs(radius - 9) <= 0.55) return colors.primary;
      if (Math.abs(radius - 6) <= 0.55) return colors.secondary;
    }
  }
  return colors.background;
});

const checks = (colors: PatternColors) => makePattern(64, 64, (x, y) => {
  const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
  return checker ? colors.background : colors.primary;
});

const crisscross = (colors: PatternColors) => makePattern(64, 64, (x, y) => {
  const rising = (x - y + 64) % 16;
  const falling = (x + y) % 16;
  const crossed = rising === 2 || rising === 5 || falling === 2 || falling === 5;
  return crossed ? colors.primary : colors.background;
});

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  {
    id: "pluses",
    label: "Plus field",
    defaultColors: { background: "#10140f", primary: "#4c5b30", secondary: "#22291d" },
    speed: [3, 6],
    render: pluses,
  },
  {
    id: "dots",
    label: "Dot matrix",
    defaultColors: { background: "#10140f", primary: "#4c5b30" },
    speed: [2, 4],
    render: dots,
  },
  {
    id: "seigaiha",
    label: "Seigaiha",
    defaultColors: { background: "#081828", primary: "#386888", secondary: "#88b8c8" },
    speed: [2, 5],
    render: seigaiha,
  },
  {
    id: "checks",
    label: "Micro check",
    defaultColors: { background: "#10140f", primary: "#4c5b30" },
    speed: [1, 3],
    render: checks,
  },
  {
    id: "crisscross",
    label: "Crisscross",
    defaultColors: { background: "#10140f", primary: "#4c5b30" },
    speed: [2, 4],
    render: crisscross,
  },
];

export const createDefaultBackgroundPresetColors = () => Object.fromEntries(
  BACKGROUND_PRESETS.map((preset) => [preset.id, { ...preset.defaultColors }]),
) as BackgroundPresetColorMap;

export const generateBackgroundPreset = (
  preset: BackgroundPreset,
  colors: BackgroundPresetColors = preset.defaultColors,
) => preset.render(resolveColors(colors));

export const backgroundPreset = (id: BackgroundPresetId) => {
  const preset = BACKGROUND_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown background preset: ${id}`);
  return preset;
};

export const randomBackgroundPreset = (random = Math.random) => {
  const index = Math.min(BACKGROUND_PRESETS.length - 1, Math.floor(random() * BACKGROUND_PRESETS.length));
  return BACKGROUND_PRESETS[index];
};

export const randomBackgroundMotion = (preset: BackgroundPreset, random = Math.random) => {
  const [minimum, maximum] = preset.speed;
  const speed = minimum + Math.floor(random() * (maximum - minimum + 1));
  const angle = random() * Math.PI * 2;
  let scrollX = Math.round(Math.cos(angle) * speed);
  let scrollY = Math.round(Math.sin(angle) * speed);
  if (scrollX === 0 && scrollY === 0) scrollX = minimum;
  return { scrollX, scrollY };
};
