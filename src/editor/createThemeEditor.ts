// ╭─────────────────────────────╮
// │  Theme Editor Controller    │
// │  Owns studio state, asset    │
// │  processing, and downloads.  │
// ╰─────────────────────────────╯

import { createMemo, createSignal, onMount } from "solid-js";
import { createStore, produce } from "solid-js/store";
import defaultFontUrl from "../assets/default-font.png";
import terminalSampleUrl from "../assets/terminal-sample.png";
import {
  DEFAULT_SETTINGS,
  LAYOUT_PRESETS,
  safeThemeName,
  settingsToCompilerConfig,
  type LayoutPresetName,
} from "../defaults";
import { compileTheme } from "../lib/gbatheme";
import { loadPixelImage, prepareBackground, prepareFont } from "../lib/image";
import type { PixelImage, RegionSettings, ThemeColors, ThemeRegion, ThemeSettings } from "../types";

const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function createThemeEditor() {
  const [settings, setSettings] = createStore<ThemeSettings>(structuredClone(DEFAULT_SETTINGS));
  const [font, setFont] = createSignal<PixelImage>();
  const [background, setBackground] = createSignal<PixelImage>();
  const [backgroundName, setBackgroundName] = createSignal<string>();
  const [fontName, setFontName] = createSignal("Official default font");
  const [message, setMessage] = createSignal("Loading the official font…");

  onMount(async () => {
    try {
      setFont(await loadPixelImage(defaultFontUrl, 128, 64));
      setMessage("Ready to build");
    } catch (error) {
      setMessage(errorMessage(error, "Could not load the default font."));
    }
  });

  const compiled = createMemo(() => {
    const loadedFont = font();
    if (!loadedFont) return undefined;
    try {
      return compileTheme(settingsToCompilerConfig(settings, loadedFont, background()));
    } catch {
      return undefined;
    }
  });

  const setPreset = (name: LayoutPresetName) => {
    const preset = LAYOUT_PRESETS[name];
    setSettings(produce((draft) => {
      draft.header = { ...preset.header };
      draft.footer = { ...preset.footer };
      draft.files = { ...preset.files };
    }));
  };

  const handleBackground = async (file: File) => {
    try {
      setMessage("Optimizing image for GBA…");
      setBackground(await prepareBackground(file));
      setBackgroundName(file.name);
      setMessage("Image ready · reduced to 15 colors");
    } catch (error) {
      setMessage(errorMessage(error, "Could not process that image."));
    }
  };

  const handleFont = async (file: File) => {
    try {
      setMessage("Building the font sheet…");
      setFont(await prepareFont(file));
      setFontName(file.name);
      setMessage(/\.(ttf|otf|woff2?)$/i.test(file.name) ? "Font converted · auto-fitted to 8×8" : "Font ready");
    } catch (error) {
      setMessage(errorMessage(error, "Could not process that font."));
    }
  };

  const downloadBackgroundTemplate = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("Your browser could not create the background template.");
      return;
    }
    context.fillStyle = settings.colors.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage("Your browser could not create the background template.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "evertheme-background-240x160.png";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage("240×160 background template downloaded");
    }, "image/png");
  };

  const loadSample = async () => {
    try {
      setMessage("Loading sample…");
      setBackground(await loadPixelImage(terminalSampleUrl, 240, 160));
      setBackgroundName("Terminal sample");
      setSettings("colors", {
        background: "#151030",
        chrome: "#292929",
        text: "#d8f848",
        directory: "#48f848",
        selection: "#512878",
        selectionText: "#f8f8f8",
      });
      setPreset("minimal");
      setMessage("Sample loaded");
    } catch (error) {
      setMessage(errorMessage(error, "Could not load the sample."));
    }
  };

  const reset = () => {
    setSettings(structuredClone(DEFAULT_SETTINGS));
    setBackground(undefined);
    setBackgroundName(undefined);
    setMessage("Editor reset");
  };

  const downloadTheme = () => {
    const bytes = compiled();
    if (!bytes) {
      setMessage("Theme is not ready to export yet.");
      return;
    }
    const name = `${safeThemeName(settings.name)}.bgr`;
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`${name} downloaded`);
  };

  return {
    settings,
    font,
    background,
    backgroundName,
    fontName,
    message,
    compiled,
    handleBackground,
    handleFont,
    loadSample,
    downloadBackgroundTemplate,
    setPreset,
    setRegionNumber: (region: ThemeRegion, key: keyof RegionSettings, value: string) => {
      setSettings(region, key, Number(value));
    },
    setName: (value: string) => setSettings("name", value),
    setColor: (key: keyof ThemeColors, value: string) => setSettings("colors", key, value),
    setMotion: (scrollX: number, scrollY: number) => setSettings({ scrollX, scrollY }),
    downloadTheme,
    reset,
  };
}
