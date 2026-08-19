// ╭──────────────────────────────╮
// │  Theme Palette Presets       │
// │  Maps familiar color schemes │
// │  onto the six GBA menu roles.│
// ╰──────────────────────────────╯

import type { ThemeColors } from "./types";

type PalettePreset = {
  id: string;
  label: string;
  colors: ThemeColors;
};

export const SEGLECTIC_THEME_PRESET = {
  id: "seglectic",
  label: "Seglectic",
  colors: {
    background: "#111510",
    chrome: "#29362a",
    text: "#ffffff",
    directory: "#d4531a",
    selection: "#ffbe6f",
    selectionText: "#152015",
  },
  regions: {
    header: { style: 1, x: 15, y: 19, width: 24, height: 1, textX: 0, textY: 0 },
    files: { style: 9, x: 0, y: 0, width: 30, height: 18, textX: 0, textY: 0 },
    footer: { style: 1, x: 0, y: 18, width: 23, height: 2, textX: 0, textY: 0 },
  },
  background: {
    id: "pluses",
    colors: { primary: "#365880", secondary: "#22291d", background: "#10140f" },
  },
} as const;

export const PALETTE_PRESETS = [
  {
    id: "evertheme",
    label: "EverTheme",
    colors: {
      background: "#111510",
      chrome: "#29362a",
      text: "#f1f1d2",
      directory: "#d9bc68",
      selection: "#bbd675",
      selectionText: "#152015",
    },
  },
  {
    id: SEGLECTIC_THEME_PRESET.id,
    label: SEGLECTIC_THEME_PRESET.label,
    colors: SEGLECTIC_THEME_PRESET.colors,
  },
  {
    id: "nord",
    label: "Nord",
    colors: {
      background: "#2e3440",
      chrome: "#3b4252",
      text: "#d8dee9",
      directory: "#88c0d0",
      selection: "#5e81ac",
      selectionText: "#eceff4",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    colors: {
      background: "#282a36",
      chrome: "#44475a",
      text: "#f8f8f2",
      directory: "#bd93f9",
      selection: "#6272a4",
      selectionText: "#f8f8f2",
    },
  },
  {
    id: "gruvbox",
    label: "Gruvbox Dark",
    colors: {
      background: "#282828",
      chrome: "#3c3836",
      text: "#ebdbb2",
      directory: "#fabd2f",
      selection: "#458588",
      selectionText: "#fbf1c7",
    },
  },
  {
    id: "catppuccin",
    label: "Catppuccin Mocha",
    colors: {
      background: "#1e1e2e",
      chrome: "#313244",
      text: "#cdd6f4",
      directory: "#89b4fa",
      selection: "#cba6f7",
      selectionText: "#1e1e2e",
    },
  },
  {
    id: "solarized",
    label: "Solarized Dark",
    colors: {
      background: "#002b36",
      chrome: "#073642",
      text: "#839496",
      directory: "#b58900",
      selection: "#268bd2",
      selectionText: "#fdf6e3",
    },
  },
  {
    id: "debug",
    label: "Debug mappings",
    colors: {
      background: "#f800f8",
      chrome: "#00f8f8",
      text: "#f8f8f8",
      directory: "#f8f800",
      selection: "#f80000",
      selectionText: "#00f800",
    },
  },
] as const satisfies readonly PalettePreset[];

export type PalettePresetId = (typeof PALETTE_PRESETS)[number]["id"];

export const palettePreset = (id: PalettePresetId) => {
  const preset = PALETTE_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown palette preset: ${id}`);
  return preset;
};

export const matchingPalettePreset = (colors: ThemeColors) => PALETTE_PRESETS.find((preset) =>
  (Object.keys(colors) as Array<keyof ThemeColors>).every((key) => colors[key].toLowerCase() === preset.colors[key]),
);
