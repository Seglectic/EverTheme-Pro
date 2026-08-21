// ╭──────────────────────────────╮
// │  GBA Pro Workspace           │
// │  Keeps the established BGR   │
// │  editor behind one boundary. │
// ╰──────────────────────────────╯

import type { Component } from "solid-js";
import type { createThemeEditor } from "../editor/createThemeEditor";
import AssetsPanel from "./AssetsPanel";
import ThemePanel from "./ThemePanel";
import ThemePreview from "./ThemePreview";

type ProWorkspaceProps = {
  editor: ReturnType<typeof createThemeEditor>;
};

const ProWorkspace: Component<ProWorkspaceProps> = (props) => (
  <section
    id="pro-workspace"
    class="studio"
    role="tabpanel"
    aria-labelledby="device-mode-pro"
    aria-label="GBA Pro theme editor"
  >
    <AssetsPanel
      settings={props.editor.settings}
      backgroundName={props.editor.backgroundName()}
      backgroundPresetId={props.editor.backgroundPresetId()}
      backgroundPresetColors={props.editor.backgroundPresetColors()}
      fontName={props.editor.fontName()}
      onBackground={props.editor.handleBackground}
      onBackgroundPreset={props.editor.loadBackgroundPreset}
      onBackgroundPresetColor={props.editor.setBackgroundPresetColor}
      onFont={props.editor.handleFont}
      onLoadSample={props.editor.loadSample}
      onDownloadTemplate={props.editor.downloadBackgroundTemplate}
      onPreset={props.editor.setPreset}
      onRegionNumber={props.editor.setRegionNumber}
      onThemePreset={props.editor.setThemePreset}
    />

    <section class="preview-column">
      <ThemePreview
        settings={props.editor.settings}
        background={props.editor.background()}
        font={props.editor.font()}
      />
    </section>

    <ThemePanel
      settings={props.editor.settings}
      compiled={props.editor.compiled()}
      onName={props.editor.setName}
      onColor={props.editor.setColor}
      onPalettePreset={props.editor.setPalettePreset}
      onMotion={props.editor.setMotion}
      onDownload={props.editor.downloadTheme}
      onReset={props.editor.reset}
    />
  </section>
);

export default ProWorkspace;
