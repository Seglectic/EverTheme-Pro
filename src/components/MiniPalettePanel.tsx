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
      <div class="color-list mini-color-list">
        <For each={Object.entries(MINI_PALETTE_LABELS) as Array<[MiniPaletteRole, string]>}>
          {([role, label]) => (
            <label class="color-row">
              <input
                type="color"
                value={props.colors[role]}
                data-mini-palette-source={role}
                onInput={(event) => props.onColor(role, event.currentTarget.value)}
                onPointerEnter={() => props.onActiveRole(role)}
                onPointerLeave={(event) => {
                  if (document.activeElement !== event.currentTarget) props.onActiveRole();
                }}
                onFocus={() => props.onActiveRole(role)}
                onBlur={() => props.onActiveRole()}
              />
              <span>{label}</span>
              <code>{props.colors[role].toUpperCase()}</code>
            </label>
          )}
        </For>
      </div>
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
