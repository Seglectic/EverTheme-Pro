// ╭─────────────────────────────╮
// │  EverTheme Pro Studio       │
// │  Composes the editor shell, │
// │  controls and live preview. │
// ╰─────────────────────────────╯

import AssetsPanel from "./components/AssetsPanel";
import PixelGridBackdrop from "./components/PixelGridBackdrop";
import ThemePanel from "./components/ThemePanel";
import ThemePreview from "./components/ThemePreview";
import { createThemeEditor } from "./editor/createThemeEditor";
import { version } from "../package.json";

export default function App() {
  const editor = createThemeEditor();

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
      <main class="app-shell" id="top">
        <section class="studio" aria-label="Theme editor">
          <AssetsPanel
            settings={editor.settings}
            backgroundName={editor.backgroundName()}
            backgroundPresetId={editor.backgroundPresetId()}
            backgroundPresetColors={editor.backgroundPresetColors()}
            fontName={editor.fontName()}
            onBackground={editor.handleBackground}
            onBackgroundPreset={editor.loadBackgroundPreset}
            onBackgroundPresetColor={editor.setBackgroundPresetColor}
            onFont={editor.handleFont}
            onLoadSample={editor.loadSample}
            onDownloadTemplate={editor.downloadBackgroundTemplate}
            onPreset={editor.setPreset}
            onRegionNumber={editor.setRegionNumber}
            onThemePreset={editor.setThemePreset}
          />

          <section class="preview-column">
            <ThemePreview settings={editor.settings} background={editor.background()} font={editor.font()} />
          </section>

          <ThemePanel
            settings={editor.settings}
            compiled={editor.compiled()}
            onName={editor.setName}
            onColor={editor.setColor}
            onPalettePreset={editor.setPalettePreset}
            onMotion={editor.setMotion}
            onDownload={editor.downloadTheme}
            onReset={editor.reset}
          />
        </section>

        <footer class="site-footer">
          <a href="https://www.seglectic.com/">Seglectic Systems</a>
          <div class="site-disclaimers">
            <p>Built for EverDrive GBA PRO.</p>
            <p>Independent; not affiliated with Krikzz.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
