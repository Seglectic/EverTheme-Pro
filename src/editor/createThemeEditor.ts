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
import {
  backgroundPreset,
  createDefaultBackgroundPresetColors,
  generateBackgroundPreset,
  generateSolidBackground,
  randomBackgroundMotion,
  randomBackgroundPreset,
  type BackgroundPresetColorKey,
  type BackgroundPresetColorMap,
  type BackgroundPresetId,
} from "../lib/backgroundPresets";
import { quantizeGbaColor, quantizeGbaPalette } from "../lib/gbaColor";
import { compileTheme } from "../lib/gbatheme";
import { loadPixelImage, prepareBackground, prepareFont } from "../lib/image";
import { palettePreset, type PalettePresetId } from "../palettePresets";
import { themePreset, type ThemePresetId } from "../themePresets";
import type { ProShareState } from "../lib/shareState";
import type { PixelImage, RegionSettings, ThemeColors, ThemeRegion, ThemeSettings } from "../types";

const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

const hardwareBackgroundColors = (colors: BackgroundPresetColorMap): BackgroundPresetColorMap => Object.fromEntries(
  Object.entries(colors).map(([id, palette]) => [id, quantizeGbaPalette(palette)]),
) as BackgroundPresetColorMap;

export function createThemeEditor(shared?: ProShareState) {
  const initialPreset = shared ? backgroundPreset(shared.backgroundPresetId) : randomBackgroundPreset();
  const initialPresetColors = hardwareBackgroundColors(createDefaultBackgroundPresetColors());
  if (shared) initialPresetColors[initialPreset.id] = { ...shared.backgroundColors };
  const initialSettings = structuredClone(shared?.settings ?? DEFAULT_SETTINGS);
  if (!shared) Object.assign(initialSettings, randomBackgroundMotion(initialPreset));
  const [settings, setSettings] = createStore<ThemeSettings>(initialSettings);
  const [font, setFont] = createSignal<PixelImage>();
  const initialBackground = initialPreset.id === "solid"
    ? generateSolidBackground(initialSettings.colors.background)
    : generateBackgroundPreset(initialPreset, initialPresetColors[initialPreset.id]);
  const [background, setBackground] = createSignal<PixelImage>(initialBackground);
  const [backgroundName, setBackgroundName] = createSignal(`Built-in · ${initialPreset.label}`);
  const [backgroundPresetId, setBackgroundPresetId] = createSignal<BackgroundPresetId | undefined>(initialPreset.id);
  const [backgroundPresetColors, setBackgroundPresetColors] = createSignal(initialPresetColors);
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
      setBackgroundPresetId(undefined);
      setSettings({ scrollX: 0, scrollY: 0 });
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
      setBackgroundPresetId(undefined);
      setSettings("colors", quantizeGbaPalette({
        background: "#151030",
        chrome: "#292929",
        text: "#d8f848",
        directory: "#48f848",
        selection: "#512878",
        selectionText: "#f8f8f8",
      }));
      setSettings({ scrollX: 0, scrollY: 0 });
      setPreset("minimal");
      setMessage("Sample loaded");
    } catch (error) {
      setMessage(errorMessage(error, "Could not load the sample."));
    }
  };

  const loadBackgroundPreset = (id: BackgroundPresetId) => {
    const preset = backgroundPreset(id);
    setBackground(preset.id === "solid"
      ? generateSolidBackground(settings.colors.background)
      : generateBackgroundPreset(preset, backgroundPresetColors()[id]));
    setBackgroundName(`Built-in · ${preset.label}`);
    setBackgroundPresetId(id);
    setSettings(randomBackgroundMotion(preset));
    setMessage(preset.id === "solid" ? "Solid background loaded" : `${preset.label} loaded · randomized motion`);
  };

  const setBackgroundPresetColor = (key: BackgroundPresetColorKey, value: string) => {
    const id = backgroundPresetId();
    if (!id) return;
    const preset = backgroundPreset(id);
    const current = backgroundPresetColors();
    const colors = { ...current[id], [key]: quantizeGbaColor(value) };
    setBackgroundPresetColors({ ...current, [id]: colors });
    setBackground(preset.id === "solid" ? generateSolidBackground(settings.colors.background) : generateBackgroundPreset(preset, colors));
    setMessage(`${preset.label} colors updated`);
  };

  const setPalettePreset = (id: PalettePresetId) => {
    const colors = quantizeGbaPalette({ ...palettePreset(id).colors });
    setSettings("colors", colors);
    if (backgroundPresetId() === "solid") setBackground(generateSolidBackground(colors.background));
  };

  const setThemePreset = (id: ThemePresetId) => {
    const coordinated = themePreset(id);
    const preset = backgroundPreset(coordinated.background.id);
    const colors = quantizeGbaPalette({ ...coordinated.background.colors });
    const themeColors = quantizeGbaPalette({ ...coordinated.colors });
    const presetColors = { ...backgroundPresetColors(), [preset.id]: colors };
    setSettings(produce((draft) => {
      draft.colors = themeColors;
      draft.header = { ...coordinated.regions.header };
      draft.files = { ...coordinated.regions.files };
      draft.footer = { ...coordinated.regions.footer };
      Object.assign(draft, randomBackgroundMotion(preset));
    }));
    setBackgroundPresetColors(presetColors);
    setBackground(preset.id === "solid"
      ? generateSolidBackground(themeColors.background)
      : generateBackgroundPreset(preset, colors));
    setBackgroundName(`Built-in · ${preset.label}`);
    setBackgroundPresetId(preset.id);
    setMessage(`${coordinated.label} preset loaded`);
  };

  const reset = () => {
    const preset = randomBackgroundPreset();
    const presetColors = hardwareBackgroundColors(createDefaultBackgroundPresetColors());
    const nextSettings = structuredClone(DEFAULT_SETTINGS);
    Object.assign(nextSettings, randomBackgroundMotion(preset));
    setSettings(nextSettings);
    setBackgroundPresetColors(presetColors);
    setBackground(preset.id === "solid"
      ? generateSolidBackground(nextSettings.colors.background)
      : generateBackgroundPreset(preset, presetColors[preset.id]));
    setBackgroundName(`Built-in · ${preset.label}`);
    setBackgroundPresetId(preset.id);
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
    backgroundPresetId,
    backgroundPresetColors,
    fontName,
    message,
    compiled,
    handleBackground,
    loadBackgroundPreset,
    setBackgroundPresetColor,
    handleFont,
    loadSample,
    downloadBackgroundTemplate,
    setPreset,
    setRegionNumber: (region: ThemeRegion, key: keyof RegionSettings, value: string) => {
      setSettings(region, key, Number(value));
    },
    setName: (value: string) => setSettings("name", value),
    setColor: (key: keyof ThemeColors, value: string) => {
      const color = quantizeGbaColor(value);
      setSettings("colors", key, color);
      if (key === "background" && backgroundPresetId() === "solid") setBackground(generateSolidBackground(color));
    },
    setPalettePreset,
    setThemePreset,
    setMotion: (scrollX: number, scrollY: number) => setSettings({ scrollX, scrollY }),
    downloadTheme,
    reset,
  };
}
