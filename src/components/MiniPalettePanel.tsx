// ╭──────────────────────────────╮
// │  Mini Palette Controls       │
// │  Edits verified color roles  │
// │  and exports patched GBAOS.  │
// ╰──────────────────────────────╯

import { For, type Component } from "solid-js";
import {
  matchingMiniPalettePreset,
  MINI_PALETTE_LABELS,
  MINI_PALETTE_PRESETS,
  type MiniPalette,
  type MiniPalettePresetId,
  type MiniPaletteRole,
} from "../mini/palette";
import type { MiniPatchResult } from "../mini/patchGbaOs";
import { Download } from "./icons";
import PaletteColorList, { type PaletteColorItem } from "./PaletteColorList";

type MiniPalettePanelProps = {
  romReady: boolean;
  colors: MiniPalette;
  patch?: MiniPatchResult;
  backgroundName: string;
  hasBackground: boolean;
  message: string;
  onColor: (role: MiniPaletteRole, value: string) => void;
  onPreset: (id: MiniPalettePresetId) => void;
  onDownload: () => void;
  onActiveRole: (role?: MiniPaletteRole) => void;
};

const outputSummary = (props: MiniPalettePanelProps) => {
  if (!props.romReady) return "Drop stock v1.17 when ready to download";
  const roleCount = props.patch?.changes.length ?? 0;
  if (props.backgroundName) return roleCount
    ? `Background + ${roleCount} palette roles`
    : `Background · ${props.backgroundName}`;
  if (props.hasBackground) return roleCount
    ? `Solid background + ${roleCount} palette roles`
    : "Solid background";
  return roleCount
    ? `${roleCount} roles · ${props.patch?.bytesChanged ?? 0} bytes changed`
    : "Add an image or choose colors";
};

const MINI_COLOR_CONTRAST: Record<MiniPaletteRole, MiniPaletteRole> = {
  background: "romText",
  basicText: "background",
  romText: "background",
  folderText: "background",
  menuHeader: "basicText",
  menuChrome: "basicText",
};

const MINI_COLOR_ITEMS = (Object.entries(MINI_PALETTE_LABELS) as Array<[MiniPaletteRole, string]>)
  .map(([role, label]) => ({ role, label, contrastWith: MINI_COLOR_CONTRAST[role] })) satisfies Array<PaletteColorItem<MiniPaletteRole>>;

const MiniPalettePanel: Component<MiniPalettePanelProps> = (props) => (
  <aside class="panel mini-palette-panel">
    <h2 class="section-heading">Palette</h2>
    <fieldset class="mini-palette-fieldset">
      <select
        aria-label="Mini palette preset"
        class="palette-preset-select"
        value={matchingMiniPalettePreset(props.colors)?.id ?? "custom"}
        onChange={(event) => {
          if (event.currentTarget.value !== "custom") props.onPreset(event.currentTarget.value as MiniPalettePresetId);
        }}
      >
        <option value="custom" disabled>Custom</option>
        <For each={MINI_PALETTE_PRESETS}>{(preset) => <option value={preset.id}>{preset.label}</option>}</For>
      </select>
      <PaletteColorList
        items={MINI_COLOR_ITEMS}
        colors={props.colors}
        onColor={props.onColor}
        onActiveRole={props.onActiveRole}
      />
    </fieldset>

    <div class="field-group mini-output-controls">
      <h2 class="section-heading">Output</h2>
      <div class="export-card">
        <strong>GBAOS.gba</strong>
        <span>{outputSummary(props)}</span>
        <button
          class="download-button"
          type="button"
          disabled={!props.romReady || (!props.hasBackground && !props.patch?.changes.length)}
          onClick={props.onDownload}
        >
          <Download size={18} /> Download patched ROM
        </button>
      </div>
      <p class="mini-install-note">Back up your existing file. Install the download as <code>/GBASYS/GBAOS.gba</code>.</p>
      <p class="mini-editor-message" role="status">{props.message}</p>
    </div>
  </aside>
);

export default MiniPalettePanel;
