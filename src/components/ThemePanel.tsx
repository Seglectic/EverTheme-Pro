// ╭─────────────────────────────╮
// │  Theme Controls             │
// │  Tunes palettes and motion, │
// │  then exports BGR output.   │
// ╰─────────────────────────────╯

import { For, Show, type Component } from "solid-js";
import { safeThemeName } from "../defaults";
import { formatBytes } from "../lib/format";
import { matchingPalettePreset, PALETTE_PRESETS, type PalettePresetId } from "../palettePresets";
import type { ThemeColors, ThemeSettings } from "../types";
import { Download, RotateCcw } from "./icons";
import MotionGrid from "./MotionGrid";

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Base",
  chrome: "Popup fill",
  text: "Text + outlines",
  directory: "Folder text",
  selection: "Selected background",
  selectionText: "Selected text",
};

const visualMotionX = (scrollX: number) => -scrollX;

type ThemePanelProps = {
  settings: ThemeSettings;
  compiled?: Uint8Array;
  onName: (value: string) => void;
  onColor: (key: keyof ThemeColors, value: string) => void;
  onPalettePreset: (id: PalettePresetId) => void;
  onMotion: (x: number, y: number) => void;
  onDownload: () => void;
  onReset: () => void;
};

const ThemePanel: Component<ThemePanelProps> = (props) => (
  <aside class="panel finish-panel">
    <div class="field-group theme-name-group">
      <label for="theme-name">Theme name</label>
      <div class="filename-input">
        <input id="theme-name" value={props.settings.name} onInput={(event) => props.onName(event.currentTarget.value)} />
        <span>.bgr</span>
      </div>
    </div>

    <div class="field-group">
      <h2 class="section-heading">Palette</h2>
      <select
        id="palette-preset"
        aria-label="Palette preset"
        class="palette-preset-select"
        value={matchingPalettePreset(props.settings.colors)?.id ?? "custom"}
        onChange={(event) => {
          if (event.currentTarget.value !== "custom") props.onPalettePreset(event.currentTarget.value as PalettePresetId);
        }}
      >
        <option value="custom" disabled>Custom</option>
        <For each={PALETTE_PRESETS}>{(preset) => <option value={preset.id}>{preset.label}</option>}</For>
      </select>
      <div class="color-list">
        <For each={Object.entries(COLOR_LABELS) as Array<[keyof ThemeColors, string]>}>
          {([key, label]) => (
            <label class="color-row">
              <input
                type="color"
                value={props.settings.colors[key]}
                onInput={(event) => props.onColor(key, event.currentTarget.value)}
              />
              <span>{label}</span>
              <code>{props.settings.colors[key].toUpperCase()}</code>
            </label>
          )}
        </For>
      </div>
    </div>

    <div class="field-group motion-controls">
      <h2 class="section-heading">Motion</h2>
      <MotionGrid
        x={visualMotionX(props.settings.scrollX)}
        y={props.settings.scrollY}
        onCommit={(x, y) => props.onMotion(visualMotionX(x), y)}
      />
    </div>

    <div class="field-group output-controls">
      <h2 class="section-heading">Output</h2>
      <div class="export-card">
        <div>
          <strong>{safeThemeName(props.settings.name)}.bgr</strong>
        </div>
        <Show when={props.compiled} fallback={<span>Preparing…</span>}>
          <span>{formatBytes(props.compiled!.length)} · ready</span>
        </Show>
        <button class="download-button" type="button" disabled={!props.compiled} onClick={props.onDownload}>
          <Download size={17} /> Download theme
        </button>
      </div>
    </div>

    <button class="reset-button" type="button" onClick={props.onReset}><RotateCcw size={14} /> Reset editor</button>
  </aside>
);

export default ThemePanel;
