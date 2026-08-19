// ╭─────────────────────────────╮
// │  Theme Controls             │
// │  Tunes palettes and motion, │
// │  then exports BGR output.   │
// ╰─────────────────────────────╯

import { For, Show, type Component } from "solid-js";
import { safeThemeName } from "../defaults";
import { formatBytes } from "../lib/format";
import type { ThemeColors, ThemeSettings } from "../types";
import { Download, RotateCcw } from "./icons";

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Base",
  chrome: "Chrome",
  text: "File text",
  directory: "Folders",
  selection: "Selection",
  selectionText: "Selected text",
};

type ThemePanelProps = {
  settings: ThemeSettings;
  compiled?: Uint8Array;
  onName: (value: string) => void;
  onColor: (key: keyof ThemeColors, value: string) => void;
  onScroll: (key: "scrollX" | "scrollY", value: number) => void;
  onDownload: () => void;
  onReset: () => void;
};

const ThemePanel: Component<ThemePanelProps> = (props) => (
  <aside class="panel finish-panel">
    <div class="panel-heading">
      <span>02</span>
      <div><p>Finish & export</p><h2>Theme</h2></div>
    </div>

    <div class="field-group">
      <label for="theme-name">Theme name</label>
      <div class="filename-input">
        <input id="theme-name" value={props.settings.name} onInput={(event) => props.onName(event.currentTarget.value)} />
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

    <div class="field-group scroll-controls">
      <label>Background motion</label>
      <label>
        Horizontal <output>{props.settings.scrollX}</output>
        <input
          type="range"
          min="-8"
          max="8"
          value={props.settings.scrollX}
          onInput={(event) => props.onScroll("scrollX", Number(event.currentTarget.value))}
        />
      </label>
      <label>
        Vertical <output>{props.settings.scrollY}</output>
        <input
          type="range"
          min="-8"
          max="8"
          value={props.settings.scrollY}
          onInput={(event) => props.onScroll("scrollY", Number(event.currentTarget.value))}
        />
      </label>
    </div>

    <div class="export-card">
      <div>
        <small>OUTPUT</small>
        <strong>{safeThemeName(props.settings.name)}.bgr</strong>
      </div>
      <Show when={props.compiled} fallback={<span>Preparing…</span>}>
        <span>{formatBytes(props.compiled!.length)} · ready</span>
      </Show>
      <button class="download-button" type="button" disabled={!props.compiled} onClick={props.onDownload}>
        <Download size={17} /> Download theme
      </button>
    </div>

    <button class="reset-button" type="button" onClick={props.onReset}><RotateCcw size={14} /> Reset editor</button>
  </aside>
);

export default ThemePanel;
