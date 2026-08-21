// ╭──────────────────────────────╮
// │  Device Mode Switch          │
// │  Routes between Pro themes   │
// │  and Mini OS palettes.       │
// ╰──────────────────────────────╯

import type { Component } from "solid-js";
import type { DeviceMode } from "../deviceModes";

type DeviceModeSwitchProps = {
  mode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
};

const DeviceModeSwitch: Component<DeviceModeSwitchProps> = (props) => (
  <nav class="device-mode-switch" aria-label="EverDrive model">
    <span class="device-mode-label">Build for</span>
    <div class="device-mode-tabs" role="tablist" aria-label="EverDrive model">
      <button
        id="device-mode-pro"
        type="button"
        role="tab"
        aria-controls="pro-workspace"
        aria-selected={props.mode === "pro"}
        onClick={() => props.onChange("pro")}
      >
        GBA Pro
      </button>
      <button
        id="device-mode-mini"
        type="button"
        role="tab"
        aria-controls="mini-workspace"
        aria-selected={props.mode === "mini"}
        onClick={() => props.onChange("mini")}
      >
        GBA Mini <small>X5</small>
      </button>
    </div>
  </nav>
);

export default DeviceModeSwitch;
