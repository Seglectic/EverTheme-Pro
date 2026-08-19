// ╭──────────────────────────────╮
// │  Background Preset Picker    │
// │  Exposes development previews│
// │  for the procedural patterns.│
// ╰──────────────────────────────╯

import { createMemo, For, Show, type Component } from "solid-js";
import {
  BACKGROUND_PRESETS,
  backgroundPreset,
  generateBackgroundPreset,
  type BackgroundPreset,
  type BackgroundPresetColorKey,
  type BackgroundPresetColorMap,
  type BackgroundPresetId,
} from "../lib/backgroundPresets";
import { pixelImageUrl } from "../lib/image";

type BackgroundPresetPickerProps = {
  active?: BackgroundPresetId;
  colors: BackgroundPresetColorMap;
  onSelect: (id: BackgroundPresetId) => void;
  onColor: (key: BackgroundPresetColorKey, value: string) => void;
};

const colorFields = (preset: BackgroundPreset): Array<[BackgroundPresetColorKey, string]> => [
  ["primary", "Primary"],
  ...(preset.defaultColors.secondary ? [["secondary", "Secondary"]] as Array<[BackgroundPresetColorKey, string]> : []),
  ["background", "Background"],
];

const BackgroundPresetPicker: Component<BackgroundPresetPickerProps> = (props) => {
  const activePreset = createMemo(() => props.active ? backgroundPreset(props.active) : undefined);

  return (
    <div class="background-presets">
      <span class="field-label">Built-in backgrounds</span>
      <div class="background-preset-grid">
        <For each={BACKGROUND_PRESETS}>
          {(preset) => (
            <button
              classList={{ "is-active": props.active === preset.id }}
              type="button"
              aria-pressed={props.active === preset.id}
              onClick={() => props.onSelect(preset.id)}
            >
              <img src={pixelImageUrl(generateBackgroundPreset(preset, props.colors[preset.id]))} alt="" />
              <span>{preset.label}</span>
            </button>
          )}
        </For>
      </div>

      <Show when={activePreset()} keyed>
        {(preset) => (
          <div class="background-preset-colors">
            <span class="field-label">Pattern colors</span>
            <For each={colorFields(preset)}>
              {([key, label]) => (
                <label class="background-preset-color">
                  <span>{label}</span>
                  <input
                    type="color"
                    value={props.colors[preset.id][key] ?? props.colors[preset.id].primary}
                    onInput={(event) => props.onColor(key, event.currentTarget.value)}
                  />
                  <code>{(props.colors[preset.id][key] ?? props.colors[preset.id].primary).toUpperCase()}</code>
                </label>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};

export default BackgroundPresetPicker;
