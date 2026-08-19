// ╭─────────────────────────────╮
// │  Asset Controls             │
// │  Collects source files and  │
// │  configures menu geometry.  │
// ╰─────────────────────────────╯

import { For, lazy, type Component } from "solid-js";
import type { LayoutPresetName } from "../defaults";
import type {
  BackgroundPresetColorKey,
  BackgroundPresetColorMap,
  BackgroundPresetId,
} from "../lib/backgroundPresets";
import type { RegionSettings, ThemeRegion, ThemeSettings } from "../types";
import AssetDropzone from "./AssetDropzone";
import { ImageDown, SlidersHorizontal } from "./icons";

const DevBackgroundPresetPicker = import.meta.env.DEV
  ? lazy(() => import("./BackgroundPresetPicker"))
  : undefined;

const REGION_LABELS: Array<[ThemeRegion, string]> = [
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

type AssetsPanelProps = {
  settings: ThemeSettings;
  backgroundName?: string;
  backgroundPresetId?: BackgroundPresetId;
  backgroundPresetColors: BackgroundPresetColorMap;
  fontName: string;
  onBackground: (file: File) => void | Promise<void>;
  onBackgroundPreset: (id: BackgroundPresetId) => void;
  onBackgroundPresetColor: (key: BackgroundPresetColorKey, value: string) => void;
  onFont: (file: File) => void | Promise<void>;
  onLoadSample: () => void | Promise<void>;
  onDownloadTemplate: () => void;
  onPreset: (name: LayoutPresetName) => void;
  onRegionNumber: (region: ThemeRegion, key: keyof RegionSettings, value: string) => void;
};

const AssetsPanel: Component<AssetsPanelProps> = (props) => (
  <aside class="panel assets-panel">
    <h2 class="section-heading">Background</h2>
    <AssetDropzone
      kind="image"
      title="Drop Image"
      description="PNG, JPG or WebP · any size"
      accept="image/png,image/jpeg,image/webp"
      fileName={props.backgroundName}
      onFile={props.onBackground}
    />
    {DevBackgroundPresetPicker && (
      <DevBackgroundPresetPicker
        active={props.backgroundPresetId}
        colors={props.backgroundPresetColors}
        onSelect={props.onBackgroundPreset}
        onColor={props.onBackgroundPresetColor}
      />
    )}
    <div class="asset-actions">
      <button type="button" onClick={props.onLoadSample}>Try Terminal sample</button>
      <button type="button" onClick={props.onDownloadTemplate}><ImageDown size={12} /> Download 240×160 PNG</button>
    </div>

    <div class="font-upload">
      <AssetDropzone
        kind="font"
        title="Add a font"
        description="Pixel font, TTF/OTF, or 128×64 PNG"
        accept=".ttf,.otf,.woff,.woff2,image/png"
        fileName={props.fontName}
        onFile={props.onFont}
      />
      <details class="font-help">
        <summary aria-label="Where to find compatible pixel fonts">?</summary>
        <div class="font-help-card">
          <strong>Fonts that fit</strong>
          <p>Look for simple 6–8 px bitmap fonts supplied as TTF or OTF.</p>
          <ul>
            <li><a href="https://www.dafont.com/bitmap.php" target="_blank" rel="noreferrer">DaFont bitmap fonts <span aria-hidden="true">↗</span></a></li>
            <li><a href="https://itch.io/game-assets/tag-fonts/tag-pixel-art" target="_blank" rel="noreferrer">itch.io pixel fonts <span aria-hidden="true">↗</span></a></li>
            <li><a href="https://fontstruct.com/gallery/tag/9/Pixel" target="_blank" rel="noreferrer">FontStruct pixel gallery <span aria-hidden="true">↗</span></a></li>
          </ul>
          <small>Licenses vary—check the font page before redistributing a theme.</small>
        </div>
      </details>
    </div>

    <div class="field-group layout-controls">
      <h2 class="section-heading">Layout</h2>
      <div class="segmented">
        <button type="button" onClick={() => props.onPreset("framed")}>Framed</button>
        <button type="button" onClick={() => props.onPreset("classic")}>Classic</button>
        <button type="button" onClick={() => props.onPreset("minimal")}>Minimal</button>
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
              <select
                value={props.settings[region].style}
                onChange={(event) => props.onRegionNumber(region, "style", event.currentTarget.value)}
              >
                <For each={STYLE_OPTIONS}>{([value, name]) => <option value={value}>{name}</option>}</For>
              </select>
            </label>
            <div class="number-grid">
              <label>X<input type="number" min="0" max="30" value={props.settings[region].x} onInput={(event) => props.onRegionNumber(region, "x", event.currentTarget.value)} /></label>
              <label>Y<input type="number" min="0" max="20" value={props.settings[region].y} onInput={(event) => props.onRegionNumber(region, "y", event.currentTarget.value)} /></label>
              <label>W<input type="number" min="1" max="30" value={props.settings[region].width} onInput={(event) => props.onRegionNumber(region, "width", event.currentTarget.value)} /></label>
              <label>H<input type="number" min="1" max="20" value={props.settings[region].height} onInput={(event) => props.onRegionNumber(region, "height", event.currentTarget.value)} /></label>
            </div>
          </fieldset>
        )}
      </For>
    </details>
  </aside>
);

export default AssetsPanel;
