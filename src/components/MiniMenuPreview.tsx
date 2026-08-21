// ╭──────────────────────────────╮
// │  Mini Menu Preview           │
// │  Visualizes six verified     │
// │  GBAOS palette roles.        │
// ╰──────────────────────────────╯

import { createMemo, Show, type Component } from "solid-js";
import { pixelImageUrl } from "../lib/image";
import type { MiniPalette, MiniPaletteRole } from "../mini/palette";
import type { PixelImage } from "../types";

type MiniMenuPreviewProps = {
  colors: MiniPalette;
  background?: PixelImage;
  inspectRole?: MiniPaletteRole;
};

const MiniMenuPreview: Component<MiniMenuPreviewProps> = (props) => {
  const backgroundUrl = createMemo(() => props.background ? pixelImageUrl(props.background) : undefined);

  return (
    <div
      class="mini-menu-preview"
      data-palette-target="background"
      style={{
        "--mini-background": backgroundUrl() ? "#050704" : props.colors.background,
        "--mini-basic-text": props.colors.basicText,
        "--mini-rom-text": props.colors.romText,
        "--mini-folder-text": props.colors.folderText,
        "--mini-menu-header": props.colors.menuHeader,
        "--mini-menu-chrome": props.colors.menuChrome,
        "background-image": backgroundUrl() ? `url(${backgroundUrl()})` : undefined,
      }}
    >
      <header class="mini-menu-page" data-palette-target="menuChrome" data-palette-anchor-x="0.8">
        <span>Pages: 1 of 1</span>
      </header>
      <ol class="mini-menu-files" aria-label="GBAOS palette preview file list">
        <li class="is-folder"><span data-palette-target="folderText">GBASYS</span></li>
        <li class="is-rom"><span data-palette-target="romText">ADVANCE.GBA</span></li>
        <li class="is-rom">CASTLE.GBA</li>
        <li class="is-rom">GOLDENSU.GBA</li>
        <li class="is-rom">MARIOLND.GBA</li>
        <li class="is-selected" aria-current="true"><span data-palette-target="basicText">METROID.GBA</span></li>
        <li class="is-rom">MINISH.GBA</li>
        <li class="is-rom">MARIO.GBA</li>
        <li class="is-rom">ZELDA.GBA</li>
      </ol>
      <Show when={props.inspectRole === "menuHeader" || props.inspectRole === "menuChrome"}>
        <aside class="mini-menu-popup" aria-label="GBAOS File Menu palette preview">
          <strong>File Menu</strong>
          <span class="is-popup-selected" data-palette-target="menuHeader" data-palette-anchor-x="1">Start Game</span>
          <span>Cheats</span>
          <span>Game Data</span>
          <span>Rom Info</span>
          <span>Configure</span>
          <span>File Ops</span>
        </aside>
      </Show>
      <footer class="mini-menu-footer">
        <span>METROID.GBA</span>
      </footer>
    </div>
  );
};

export default MiniMenuPreview;
