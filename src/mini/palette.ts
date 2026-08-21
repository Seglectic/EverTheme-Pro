// ╭──────────────────────────────╮
// │  Mini Palette Model          │
// │  Names the six direct GBAOS  │
// │  v1.17 color roles.          │
// ╰──────────────────────────────╯

import { PALETTE_PRESETS } from "../palettePresets";
import { quantizeGbaColor } from "../lib/gbaColor";

export type MiniPaletteRole =
  | "background"
  | "basicText"
  | "romText"
  | "folderText"
  | "menuHeader"
  | "menuChrome";

export type MiniPalette = Record<MiniPaletteRole, string>;

export const MINI_PALETTE_LABELS: Record<MiniPaletteRole, string> = {
  background: "Background",
  basicText: "Title + Selected Text",
  romText: "ROM Text",
  folderText: "Folder + Popup Text",
  menuHeader: "Popup Selection",
  menuChrome: "Header/Footer Popup Fill",
};

export const STOCK_MINI_PALETTE: MiniPalette = {
  background: "#000000",
  basicText: "#ffffff",
  romText: "#bdbdbd",
  folderText: "#efef4a",
  menuHeader: "#a5a5ff",
  menuChrome: "#8c8c8c",
};

const quantizePalette = (colors: MiniPalette): MiniPalette => Object.fromEntries(
  (Object.entries(colors) as Array<[MiniPaletteRole, string]>).map(([role, color]) => [role, quantizeGbaColor(color)]),
) as MiniPalette;

export const MINI_PALETTE_PRESETS = [
  { id: "stock", label: "Stock v1.17", colors: STOCK_MINI_PALETTE },
  ...PALETTE_PRESETS.filter((preset) => preset.id !== "debug").map((preset) => ({
    id: preset.id,
    label: preset.label,
    colors: quantizePalette({
      background: preset.colors.background,
      basicText: preset.id === "evertheme" ? preset.colors.text : preset.colors.selectionText,
      romText: preset.colors.text,
      folderText: preset.colors.directory,
      menuHeader: preset.colors.selection,
      menuChrome: preset.colors.chrome,
    }),
  })),
  {
    id: "debug",
    label: "Debug mappings",
    colors: quantizePalette({
      background: "#f800f8",
      basicText: "#00f800",
      romText: "#f8f8f8",
      folderText: "#f8f800",
      menuHeader: "#f80000",
      menuChrome: "#00f8f8",
    }),
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; colors: MiniPalette }>;

export type MiniPalettePresetId = (typeof MINI_PALETTE_PRESETS)[number]["id"];

export const miniPalettePreset = (id: MiniPalettePresetId) => {
  const preset = MINI_PALETTE_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown Mini palette preset: ${id}`);
  return preset;
};

export const matchingMiniPalettePreset = (colors: MiniPalette) => MINI_PALETTE_PRESETS.find((preset) =>
  (Object.keys(colors) as MiniPaletteRole[]).every((role) => colors[role] === preset.colors[role]),
);
