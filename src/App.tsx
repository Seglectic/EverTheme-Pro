// ╭─────────────────────────────╮
// │  EverTheme Pro Studio     │
// │  Coordinates assets, UI, │
// │  preview, and BGR export. │
// ╰─────────────────────────────╯

import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Download, ImageDown, LockKeyhole, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-solid";
import defaultFontUrl from "./assets/default-font.png";
import terminalSampleUrl from "./assets/terminal-sample.png";
import AssetDropzone from "./components/AssetDropzone";
import ThemePreview from "./components/ThemePreview";
import { DEFAULT_SETTINGS, LAYOUT_PRESETS, safeThemeName, settingsToCompilerConfig } from "./defaults";
import { compileTheme } from "./lib/gbatheme";
import { loadPixelImage, prepareBackground, prepareFont } from "./lib/image";
import type { PixelImage, RegionSettings, ThemeColors, ThemeSettings } from "./types";

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Base",
  chrome: "Chrome",
  text: "File text",
  directory: "Folders",
  selection: "Selection",
  selectionText: "Selected text",
};

const REGION_LABELS: Array<["header" | "footer" | "files", string]> = [
  ["header", "Header"],
  ["files", "File list"],
  ["footer", "Footer"],
];

const STYLE_OPTIONS = [
  [0, "Off"],
  [1, "Text only"],
  [3, "Solid"],
  [9, "Shaded"],
  [13, "Shaded + border"],
] as const;

const formatBytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

export default function App() {
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
      setMessage(error instanceof Error ? error.message : "Could not load the default font.");
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

  const setPreset = (name: keyof typeof LAYOUT_PRESETS) => {
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
      const image = await prepareBackground(file);
      setBackground(image);
      setBackgroundName(file.name);
      setMessage("Image ready · reduced to 15 colors");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not process that image.");
    }
  };

  const handleFont = async (file: File) => {
    try {
      setMessage("Building the font sheet…");
      setFont(await prepareFont(file));
      setFontName(file.name);
      setMessage("Font ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not process that font.");
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
      const image = await loadPixelImage(terminalSampleUrl, 240, 160);
      setBackground(image);
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
      setMessage(error instanceof Error ? error.message : "Could not load the sample.");
    }
  };

  const reset = () => {
    setSettings(structuredClone(DEFAULT_SETTINGS));
    setBackground(undefined);
    setBackgroundName(undefined);
    setMessage("Editor reset");
  };

  const download = () => {
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

  const setRegionNumber = (region: "header" | "footer" | "files", key: keyof RegionSettings, value: string) => {
    setSettings(region, key, Number(value));
  };

  return (
    <main class="app-shell">
      <header class="site-header">
        <a class="wordmark" href="#top" aria-label="EverTheme Pro home">
          <span class="wordmark-mark">EP</span>
          <span>
            <strong>EverTheme</strong>
            <small>PRO</small>
          </span>
        </a>
        <div class="header-meta">
          <span><LockKeyhole size={13} /> 100% local</span>
          <span class="version">BGR / 01</span>
        </div>
      </header>

      <section class="hero" id="top">
        <div>
          <p class="eyebrow"><Sparkles size={14} /> Theme workshop</p>
          <h1>Make your EverDrive<br /><em>feel like yours.</em></h1>
        </div>
        <p class="hero-copy">
          Drop in an image, tune the menu, and export a cartridge-ready <code>.bgr</code> file. No Windows tool, uploads, or command line.
        </p>
      </section>

      <section class="studio" aria-label="Theme editor">
        <aside class="panel assets-panel">
          <div class="panel-heading">
            <span>01</span>
            <div><p>Source material</p><h2>Assets</h2></div>
          </div>

          <AssetDropzone
            kind="image"
            title="Drop a background"
            description="PNG, JPG or WebP · any size"
            accept="image/png,image/jpeg,image/webp"
            fileName={backgroundName()}
            onFile={handleBackground}
          />
          <div class="asset-actions">
            <button type="button" onClick={loadSample}>Try Terminal sample</button>
            <button type="button" onClick={downloadBackgroundTemplate}><ImageDown size={12} /> Download 240×160 PNG</button>
          </div>

          <AssetDropzone
            kind="font"
            title="Add a font"
            description="TTF, OTF, WOFF or 128×64 PNG"
            accept=".ttf,.otf,.woff,.woff2,image/png"
            fileName={fontName()}
            onFile={handleFont}
          />

          <div class="field-group">
            <span class="field-label">Layout</span>
            <div class="segmented">
              <button type="button" onClick={() => setPreset("framed")}>Framed</button>
              <button type="button" onClick={() => setPreset("classic")}>Classic</button>
              <button type="button" onClick={() => setPreset("minimal")}>Minimal</button>
            </div>
          </div>

          <details class="advanced">
            <summary><SlidersHorizontal size={14} /> Advanced layout</summary>
            <For each={REGION_LABELS}>
              {([region, label]) => (
                <fieldset>
                  <legend>{label}</legend>
                  <label>
                    Style
                    <select value={settings[region].style} onChange={(event) => setRegionNumber(region, "style", event.currentTarget.value)}>
                      <For each={STYLE_OPTIONS}>{([value, name]) => <option value={value}>{name}</option>}</For>
                    </select>
                  </label>
                  <div class="number-grid">
                    <label>X<input type="number" min="0" max="30" value={settings[region].x} onInput={(event) => setRegionNumber(region, "x", event.currentTarget.value)} /></label>
                    <label>Y<input type="number" min="0" max="20" value={settings[region].y} onInput={(event) => setRegionNumber(region, "y", event.currentTarget.value)} /></label>
                    <label>W<input type="number" min="1" max="30" value={settings[region].width} onInput={(event) => setRegionNumber(region, "width", event.currentTarget.value)} /></label>
                    <label>H<input type="number" min="1" max="20" value={settings[region].height} onInput={(event) => setRegionNumber(region, "height", event.currentTarget.value)} /></label>
                  </div>
                </fieldset>
              )}
            </For>
          </details>
        </aside>

        <section class="preview-column">
          <div class="preview-labels">
            <span>Live preview</span>
            <span>240 × 160</span>
          </div>
          <ThemePreview settings={settings} background={background()} font={font()} />
          <div class="status-strip">
            <span class="status-light" />
            <span>{message()}</span>
            <span class="status-size">{compiled() ? formatBytes(compiled()!.length) : "— KB"}</span>
          </div>
        </section>

        <aside class="panel finish-panel">
          <div class="panel-heading">
            <span>02</span>
            <div><p>Finish & export</p><h2>Theme</h2></div>
          </div>

          <div class="field-group">
            <label for="theme-name">Theme name</label>
            <div class="filename-input">
              <input id="theme-name" value={settings.name} onInput={(event) => setSettings("name", event.currentTarget.value)} />
              <span>.bgr</span>
            </div>
          </div>

          <div class="field-group">
            <label>Palette</label>
            <div class="color-list">
              <For each={Object.entries(COLOR_LABELS) as Array<[keyof ThemeColors, string]>}>
                {([key, label]) => (
                  <label class="color-row">
                    <input
                      type="color"
                      value={settings.colors[key]}
                      onInput={(event) => setSettings("colors", key, event.currentTarget.value)}
                    />
                    <span>{label}</span>
                    <code>{settings.colors[key].toUpperCase()}</code>
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="field-group scroll-controls">
            <label>Background motion</label>
            <label>
              Horizontal <output>{settings.scrollX}</output>
              <input type="range" min="-8" max="8" value={settings.scrollX} onInput={(event) => setSettings("scrollX", Number(event.currentTarget.value))} />
            </label>
            <label>
              Vertical <output>{settings.scrollY}</output>
              <input type="range" min="-8" max="8" value={settings.scrollY} onInput={(event) => setSettings("scrollY", Number(event.currentTarget.value))} />
            </label>
          </div>

          <div class="export-card">
            <div>
              <small>OUTPUT</small>
              <strong>{safeThemeName(settings.name)}.bgr</strong>
            </div>
            <Show when={compiled()} fallback={<span>Preparing…</span>}>
              <span>{formatBytes(compiled()!.length)} · ready</span>
            </Show>
            <button class="download-button" type="button" disabled={!compiled()} onClick={download}>
              <Download size={17} /> Download theme
            </button>
          </div>

          <button class="reset-button" type="button" onClick={reset}><RotateCcw size={14} /> Reset editor</button>
        </aside>
      </section>

      <footer class="site-footer">
        <p>Built for EverDrive GBA PRO. EverTheme Pro is an independent tool and is not affiliated with Krikzz.</p>
        <p>Images never leave this browser.</p>
      </footer>
    </main>
  );
}
