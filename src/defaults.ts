// ╭─────────────────────────────╮
// │  Theme Defaults            │
// │  Friendly presets mapped  │
// │  to official directives.  │
// ╰─────────────────────────────╯

import type { CompilerConfig, ThemeSettings } from "./types";

export const DEFAULT_SETTINGS: ThemeSettings = {
  name: "my-theme",
  header: { style: 13, x: 1, y: 1, width: 28, height: 1, textX: 1, textY: 0 },
  footer: { style: 13, x: 1, y: 17, width: 28, height: 2, textX: 1, textY: 0 },
  files: { style: 9, x: 1, y: 3, width: 28, height: 13, textX: 1, textY: 0 },
  scrollX: 0,
  scrollY: 0,
  colors: {
    background: "#111510",
    chrome: "#29362a",
    text: "#f1f1d2",
    directory: "#d9bc68",
    selection: "#bbd675",
    selectionText: "#152015",
  },
};

export const LAYOUT_PRESETS: Record<string, Pick<ThemeSettings, "header" | "footer" | "files">> = {
  framed: {
    header: DEFAULT_SETTINGS.header,
    footer: DEFAULT_SETTINGS.footer,
    files: DEFAULT_SETTINGS.files,
  },
  classic: {
    header: { style: 3, x: 0, y: 0, width: 30, height: 1, textX: 0, textY: 0 },
    footer: { style: 3, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 },
    files: { style: 1, x: 0, y: 2, width: 30, height: 15, textX: 0, textY: 0 },
  },
  minimal: {
    header: { style: 0, x: 0, y: 0, width: 30, height: 1, textX: 0, textY: 0 },
    footer: { style: 0, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 },
    files: { style: 1, x: 1, y: 2, width: 28, height: 16, textX: 0, textY: 0 },
  },
};

const hexToGbaTriplet = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = ((value >> 16) & 0xff) >> 3;
  const green = ((value >> 8) & 0xff) >> 3;
  const blue = (value & 0xff) >> 3;
  return (red << 16) | (green << 8) | blue;
};

const makePalette = (background: string, chrome: string, text: string) => [
  hexToGbaTriplet(background),
  hexToGbaTriplet(chrome),
  hexToGbaTriplet(text),
  ...Array<number>(13).fill(0),
];

export function settingsToCompilerConfig(
  settings: ThemeSettings,
  font: CompilerConfig["font"],
  background?: CompilerConfig["background"],
): CompilerConfig {
  const palettes = Array.from({ length: 16 }, () => Array<number>(16).fill(0));
  palettes[0] = makePalette(settings.colors.background, settings.colors.chrome, settings.colors.text);
  palettes[1] = makePalette(settings.colors.background, settings.colors.chrome, settings.colors.selectionText);
  palettes[2] = makePalette(settings.colors.background, settings.colors.selection, settings.colors.directory);
  palettes[3] = makePalette(settings.colors.background, settings.colors.chrome, settings.colors.text);

  return {
    header: { ...settings.header, palette: 1 },
    footer: { ...settings.footer, palette: 1 },
    files: {
      ...settings.files,
      backgroundPalette: 0,
      filePalette: 0,
      directoryPalette: 2,
      selectionPalette: 0x12,
      borderPalette: 1,
    },
    menuPalettes: [0x10, 0x12, 0x10, 0x12, 0x11, 0x11, 0x11],
    scrollX: settings.scrollX,
    scrollY: settings.scrollY,
    scrollXEnabled: settings.scrollX !== 0,
    scrollYEnabled: settings.scrollY !== 0,
    palettes,
    background,
    font,
  };
}

export function safeThemeName(name: string) {
  const cleaned = name.trim().replace(/\.bgr$/i, "").replace(/[^a-z0-9_-]+/gi, "-");
  return cleaned.replace(/^-+|-+$/g, "") || "my-theme";
}
