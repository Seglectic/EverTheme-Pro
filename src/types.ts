// ╭─────────────────────────────╮
// │  Theme Model               │
// │  Shared editor and binary │
// │  compiler contracts.       │
// ╰─────────────────────────────╯

export type PixelImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type BarStyle = 0 | 1 | 3 | 9 | 13;
export type ThemeRegion = "header" | "files" | "footer";

export type RegionSettings = {
  style: BarStyle;
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
};

export type ThemeColors = {
  background: string;
  chrome: string;
  text: string;
  directory: string;
  selection: string;
  selectionText: string;
};

export type ThemeSettings = {
  name: string;
  header: RegionSettings;
  footer: RegionSettings;
  files: RegionSettings;
  scrollX: number;
  scrollY: number;
  colors: ThemeColors;
};

export type CompilerConfig = {
  header: RegionSettings & { palette: number };
  footer: RegionSettings & { palette: number };
  files: RegionSettings & {
    backgroundPalette: number;
    filePalette: number;
    directoryPalette: number;
    selectionPalette: number;
    borderPalette: number;
  };
  menuPalettes: [number, number, number, number, number, number, number];
  scrollX: number;
  scrollY: number;
  scrollXEnabled?: boolean;
  scrollYEnabled?: boolean;
  palettes: number[][];
  background?: PixelImage;
  font: PixelImage;
  useManualBackgroundPalette?: boolean;
};
