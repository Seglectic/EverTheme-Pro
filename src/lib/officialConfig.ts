// ╭─────────────────────────────╮
// │  Official Config Parser     │
// │  Reads fixture directives   │
// │  for compiler parity tests. │
// ╰─────────────────────────────╯

import type { CompilerConfig, RegionSettings } from "../types";

export function parseOfficialConfig(text: string): Omit<CompilerConfig, "font" | "background"> {
  const values = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const equals = line.indexOf("=");
    if (equals > 0 && !line.startsWith("#")) values.set(line.slice(0, equals).trim(), line.slice(equals + 1).trim());
  }
  const number = (key: string, fallback: number) => {
    const raw = values.get(key);
    return raw === undefined ? fallback : Number.parseInt(raw, raw.toLowerCase().startsWith("0x") ? 16 : 10);
  };
  const region = (prefix: "hdr" | "foot" | "fli", defaults: RegionSettings): RegionSettings => ({
    style: number(`${prefix}_style`, defaults.style) as RegionSettings["style"],
    x: number(`${prefix}_x`, defaults.x),
    y: number(`${prefix}_y`, defaults.y),
    width: number(`${prefix}_w`, defaults.width),
    height: number(`${prefix}_h`, defaults.height),
    textX: number(`${prefix}_bx`, defaults.textX),
    textY: number(`${prefix}_by`, defaults.textY),
  });
  const palettes = Array.from({ length: 16 }, (_, paletteIndex) => {
    const raw = values.get(`palette${paletteIndex}`);
    if (!raw) return Array<number>(16).fill(0);
    const parsed = raw.replace(/[{}\s]/g, "").split(",").map((color) => Number.parseInt(color.replace(/^0x/i, ""), 16));
    return [...parsed, ...Array<number>(16).fill(0)].slice(0, 16);
  });

  return {
    header: { ...region("hdr", { style: 3, x: 0, y: 0, width: 30, height: 1, textX: 0, textY: 0 }), palette: number("hdr_pal", 0x11) },
    footer: { ...region("foot", { style: 3, x: 0, y: 18, width: 30, height: 2, textX: 0, textY: 0 }), palette: number("foot_pal", 0x11) },
    files: {
      ...region("fli", { style: 1, x: 0, y: 2, width: 30, height: 15, textX: 0, textY: 0 }),
      backgroundPalette: number("fli_pal_bg", 0),
      filePalette: number("fli_pal_file", 0),
      directoryPalette: number("fli_pal_dir", 2),
      selectionPalette: number("fli_pal_sel", 0x11),
      borderPalette: number("fli_pal_border", 0),
    },
    menuPalettes: [
      number("menu_pal_box", 0x10),
      number("menu_pal_sel", 0x12),
      number("menu_pal_txt", 0x10),
      number("menu_pal_inf", 0x12),
      number("menu_pal_msg", 0x11),
      number("menu_pal_hdr", 0x11),
      number("menu_pal_foot", 0x11),
    ],
    scrollX: number("scroll_h", 0),
    scrollY: number("scroll_v", 0),
    scrollXEnabled: values.has("scroll_h"),
    scrollYEnabled: values.has("scroll_v"),
    palettes,
    useManualBackgroundPalette: values.has("palette15"),
  };
}
