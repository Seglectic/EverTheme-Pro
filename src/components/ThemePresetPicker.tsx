// ╭──────────────────────────────╮
// │  Complete Preset Picker      │
// │  Applies coordinated themes  │
// │  from compact preview cards. │
// ╰──────────────────────────────╯

import { For, type Component } from "solid-js";
import { backgroundPreset, generateBackgroundPreset } from "../lib/backgroundPresets";
import { pixelImageUrl } from "../lib/image";
import { THEME_PRESETS, type ThemePresetId } from "../themePresets";

type ThemePresetPickerProps = {
  onSelect: (id: ThemePresetId) => void;
};

const ThemePresetPicker: Component<ThemePresetPickerProps> = (props) => (
  <section class="theme-presets" id="theme-presets-panel" role="tabpanel" aria-labelledby="theme-presets-tab">
    <h2 class="section-heading" id="theme-presets-title">Complete presets</h2>
    <div class="theme-preset-list">
      <For each={THEME_PRESETS}>
        {(preset) => (
          <button type="button" onClick={() => props.onSelect(preset.id)}>
            <img
              src={pixelImageUrl(generateBackgroundPreset(backgroundPreset(preset.background.id), preset.background.colors))}
              alt=""
            />
            <span class="theme-preset-copy">
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
              <span class="theme-preset-swatches" aria-hidden="true">
                <For each={Object.values(preset.colors)}>
                  {(color) => <i style={{ "background-color": color }} />}
                </For>
              </span>
            </span>
          </button>
        )}
      </For>
    </div>
  </section>
);

export default ThemePresetPicker;
