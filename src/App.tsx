// ╭─────────────────────────────╮
// │  EverTheme Pro Studio       │
// │  Routes product workspaces  │
// │  through the shared shell.  │
// ╰─────────────────────────────╯

import { createSignal, Show } from "solid-js";
import DeviceModeSwitch from "./components/DeviceModeSwitch";
import MiniWorkspace from "./components/MiniWorkspace";
import PixelGridBackdrop from "./components/PixelGridBackdrop";
import ProWorkspace from "./components/ProWorkspace";
import type { DeviceMode } from "./deviceModes";
import { createMiniEditor } from "./editor/createMiniEditor";
import { createThemeEditor } from "./editor/createThemeEditor";
import { version } from "../package.json";

export default function App() {
  const editor = createThemeEditor();
  const miniEditor = createMiniEditor();
  const [deviceMode, setDeviceMode] = createSignal<DeviceMode>("pro");

  return (
    <>
      <PixelGridBackdrop />
      <a class="wordmark" href="#top" aria-label="EverTheme Pro home">
        <span class="wordmark-mark">EP</span>
        <span class="wordmark-copy">
          <strong>EverTheme</strong>
          <span class="pro-pill wordmark-pro">PRO</span>
          <small class="wordmark-version">v{version}</small>
        </span>
      </a>
      <main class="app-shell" classList={{ "is-mini": deviceMode() === "mini" }} id="top">
        <DeviceModeSwitch mode={deviceMode()} onChange={setDeviceMode} />

        <Show when={deviceMode() === "pro"} fallback={<MiniWorkspace editor={miniEditor} />}>
          <ProWorkspace editor={editor} />
        </Show>

        <footer class="site-footer">
          <a href="https://www.seglectic.com/">Seglectic Systems</a>
          <div class="site-disclaimers">
            <p>Built for EverDrive GBA {deviceMode() === "pro" ? "PRO" : "Mini"}.</p>
            <p>Independent; not affiliated with Krikzz.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
