// ╭─────────────────────────────╮
// │  EverTheme Pro Studio       │
// │  Composes the editor shell, │
// │  controls and live preview. │
// ╰─────────────────────────────╯

import AssetsPanel from "./components/AssetsPanel";
import { LockKeyhole } from "./components/icons";
import PixelGridBackdrop from "./components/PixelGridBackdrop";
import ThemePanel from "./components/ThemePanel";
import ThemePreview from "./components/ThemePreview";
import { createThemeEditor } from "./editor/createThemeEditor";

export default function App() {
  const editor = createThemeEditor();

  return (
    <>
      <PixelGridBackdrop />
      <main class="app-shell" id="top">
        <header class="site-header">
          <a class="wordmark" href="#top" aria-label="EverTheme Pro home">
            <span class="wordmark-mark">EP</span>
            <span>
              <strong>EverTheme</strong>
              <small>PRO</small>
            </span>
          </a>
          <div class="header-meta">
            <span><LockKeyhole size={13} /> 100% local</span>
            <span class="version">BGR / 01</span>
          </div>
        </header>

        <section class="studio" aria-label="Theme editor">
          <AssetsPanel
            settings={editor.settings}
            backgroundName={editor.backgroundName()}
            fontName={editor.fontName()}
            onBackground={editor.handleBackground}
            onFont={editor.handleFont}
            onLoadSample={editor.loadSample}
            onDownloadTemplate={editor.downloadBackgroundTemplate}
            onPreset={editor.setPreset}
            onRegionNumber={editor.setRegionNumber}
          />

          <section class="preview-column">
            <ThemePreview settings={editor.settings} background={editor.background()} font={editor.font()} />
          </section>

          <ThemePanel
            settings={editor.settings}
            compiled={editor.compiled()}
            onName={editor.setName}
            onColor={editor.setColor}
            onMotion={editor.setMotion}
            onDownload={editor.downloadTheme}
            onReset={editor.reset}
          />
        </section>

        <footer class="site-footer">
          <p>Built for EverDrive GBA PRO. EverTheme Pro is an independent tool and is not affiliated with Krikzz.</p>
          <p>Images never leave this browser.</p>
        </footer>
      </main>
    </>
  );
}
