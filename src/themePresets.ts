// ╭──────────────────────────────╮
// │  Complete Theme Presets      │
// │  Bundles coordinated palette,│
// │  layout and background state.│
// ╰──────────────────────────────╯

import type { BackgroundPresetColors, BackgroundPresetId } from "./lib/backgroundPresets";
import type { RegionSettings, ThemeColors, ThemeRegion } from "./types";

export type ThemePreset = {
  id: string;
  label: string;
  description: string;
  colors: ThemeColors;
  regions: Record<ThemeRegion, RegionSettings>;
  background: {
    id: BackgroundPresetId;
    colors: BackgroundPresetColors;
  };
};

export const THEME_PRESETS = [
  {
    id: "seglectic",
    label: "Seglectic",
    description: "Minimal layout · Plus Field",
    colors: {
      background: "#111510",
      chrome: "#29362a",
      text: "#ffffff",
      directory: "#d4531a",
      selection: "#ffbe6f",
      selectionText: "#152015",
    },
    regions: {
      header: { style: 1, x: 15, y: 19, width: 30, height: 1, textX: 0, textY: 0 },
      files: { style: 9, x: 0, y: 0, width: 30, height: 18, textX: 0, textY: 0 },
      footer: { style: 1, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 },
    },
    background: {
      id: "pluses",
      colors: { primary: "#365880", secondary: "#22291d", background: "#10140f" },
    },
  },
] as const satisfies readonly ThemePreset[];

export type ThemePresetId = (typeof THEME_PRESETS)[number]["id"];

export const themePreset = (id: ThemePresetId) => {
  const preset = THEME_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown theme preset: ${id}`);
  return preset;
};
