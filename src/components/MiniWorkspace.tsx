// ╭──────────────────────────────╮
// │  GBA Mini Workspace          │
// │  Identifies and patches the  │
// │  verified v1.17 palette.     │
// ╰──────────────────────────────╯

import { createSignal, Show, type Component } from "solid-js";
import type { createMiniEditor } from "../editor/createMiniEditor";
import type { MiniPaletteRole } from "../mini/palette";
import AssetDropzone from "./AssetDropzone";
import GbaMiniPreviewFrame from "./GbaMiniPreviewFrame";
import MiniMenuPreview from "./MiniMenuPreview";
import MiniPalettePanel from "./MiniPalettePanel";
import PaletteConnector from "./PaletteConnector";
import "../mini-workspace.css";

type MiniWorkspaceProps = {
  editor: ReturnType<typeof createMiniEditor>;
};

const MiniWorkspace: Component<MiniWorkspaceProps> = (props) => {
  const [activeRole, setActiveRole] = createSignal<MiniPaletteRole>();

  return (
    <section
      id="mini-workspace"
      class="mini-studio"
      role="tabpanel"
      aria-labelledby="device-mode-mini"
      aria-label="GBA Mini palette editor"
    >
    <aside class="panel mini-source-panel">
      <h2 class="section-heading">GBAOS</h2>
      <Show
        when={props.editor.identification()}
        fallback={
          <div class="mini-rom-status mini-rom-status--idle" role="status">
            <strong>{props.editor.loadState() === "error" ? "Could not read this file" : "Design now · add GBAOS later"}</strong>
            <p>
              {props.editor.loadState() === "error"
                ? props.editor.loadError()
                : "Palette, presets, and backgrounds are ready. Drop stock v1.17 into the screen when you want to download."}
            </p>
          </div>
        }
      >
        {(identification) => (
          <div class={`mini-rom-status mini-rom-status--${identification().kind}`} role="status">
            <strong>
              {identification().kind === "supported"
                ? `Stock GBAOS v${identification().version} recognized`
                : identification().kind === "known-unsupported"
                  ? `Stock GBAOS v${identification().version} recognized`
                  : identification().kind === "modified"
                    ? "Modified or unknown GBAOS"
                    : "Not a supported GBAOS ROM"}
            </strong>
            <p>{identification().reason}</p>
            <dl class="mini-rom-facts">
              <div><dt>Size</dt><dd>{identification().size.toLocaleString()} bytes</dd></div>
              <div><dt>SHA-256</dt><dd><code>{identification().sha256}</code></dd></div>
            </dl>
          </div>
        )}
      </Show>
      <div class="mini-background-controls">
        <h2 class="section-heading">Background</h2>
        <AssetDropzone
          kind="image"
          title="Drop Image"
          description="PNG, JPG or WebP · any size"
          accept="image/png,image/jpeg,image/webp"
          fileName={props.editor.backgroundName()}
          onFile={props.editor.handleBackground}
        />
        <Show when={props.editor.backgroundName()}>
          <button class="mini-use-solid-button" type="button" onClick={props.editor.clearBackground}>
            Remove image · use solid color
          </button>
        </Show>
        <p>Center-cropped to 224×144 and reduced to 15 GBA colors.</p>
      </div>
    </aside>

    <section class="mini-preview-column">
      <GbaMiniPreviewFrame
        fileName={props.editor.fileName()}
        loadState={props.editor.loadState()}
        onFile={props.editor.handleRom}
      >
        <MiniMenuPreview
          colors={props.editor.palette}
          background={props.editor.background()}
          inspectRole={activeRole()}
        />
      </GbaMiniPreviewFrame>
    </section>

    <MiniPalettePanel
      romReady={props.editor.identification()?.kind === "supported"}
      colors={props.editor.palette}
      patch={props.editor.patchResult()}
      backgroundName={props.editor.backgroundName()}
      hasBackground={props.editor.hasBackground()}
      message={props.editor.message()}
      onColor={props.editor.setColor}
      onPreset={props.editor.setPalettePreset}
      onDownload={props.editor.downloadRom}
      onActiveRole={setActiveRole}
    />
    <PaletteConnector rootId="mini-workspace" role={activeRole()} colors={props.editor.palette} />
    </section>
  );
};

export default MiniWorkspace;
