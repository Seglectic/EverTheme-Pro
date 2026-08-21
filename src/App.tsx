// ╭─────────────────────────────╮
// │  EverTheme Pro Studio       │
// │  Routes product workspaces  │
// │  through the shared shell.  │
// ╰─────────────────────────────╯

import { createEffect, createSignal, Show } from "solid-js";
import DeviceModeSwitch from "./components/DeviceModeSwitch";
import MiniWorkspace from "./components/MiniWorkspace";
import PixelGridBackdrop from "./components/PixelGridBackdrop";
import ProWorkspace from "./components/ProWorkspace";
import type { DeviceMode } from "./deviceModes";
import { createMiniEditor } from "./editor/createMiniEditor";
import { createThemeEditor } from "./editor/createThemeEditor";
import { decodeShareState, encodeShareState } from "./lib/shareState";
import { version } from "../package.json";

export default function App() {
  const shared = decodeShareState(new URL(window.location.href).searchParams.get("s"));
  const editor = createThemeEditor(shared?.mode === "pro" ? shared.pro : undefined);
  const miniEditor = createMiniEditor(shared?.mode === "mini" ? shared.miniPalette : undefined);
  const [deviceMode, setDeviceMode] = createSignal<DeviceMode>(shared?.mode ?? "pro");

  createEffect(() => {
    const encoded = deviceMode() === "mini"
      ? encodeShareState({ mode: "mini", miniPalette: { ...miniEditor.palette } })
      : (() => {
        const backgroundPresetId = editor.backgroundPresetId() ?? "solid";
        return encodeShareState({
          mode: "pro",
          pro: {
            settings: editor.settings,
            backgroundPresetId,
            backgroundColors: { ...editor.backgroundPresetColors()[backgroundPresetId] },
          },
        });
      })();
    const url = new URL(window.location.href);
    url.searchParams.set("s", encoded);
    url.hash = "";
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  });

  return (
    <>
      <PixelGridBackdrop />
      <button
        class="wordmark"
        type="button"
        aria-label="Scroll to the top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span class="wordmark-mark">EP</span>
        <span class="wordmark-copy">
          <strong>EverTheme</strong>
          <span class="pro-pill wordmark-pro">PRO</span>
          <small class="wordmark-version">v{version}</small>
        </span>
      </button>
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
