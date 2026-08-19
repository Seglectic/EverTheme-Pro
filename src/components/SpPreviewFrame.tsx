// ╭──────────────────────────────╮
// │  SP Preview Frame            │
// │  Houses the rendered theme   │
// │  in an SP-inspired lid.      │
// ╰──────────────────────────────╯

import { children, type Component, type JSX } from "solid-js";
import "../preview.css";
import { randomSpFinish } from "./spFinishes";

type SpPreviewFrameProps = {
  children: JSX.Element;
};

type FastenerPosition = "top" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const Fastener: Component<{ position: FastenerPosition }> = (props) => (
  <span class={`sp-fastener sp-fastener--${props.position}`} aria-hidden="true" />
);

const SpPreviewFrame: Component<SpPreviewFrameProps> = (props) => {
  const screen = children(() => props.children);
  const finish = randomSpFinish();

  return (
    <figure
      class={`sp-frame sp-frame--${finish.slug}`}
      data-sp-finish={finish.name}
      aria-label={`Game Boy Advance SP-styled menu preview in ${finish.name}`}
    >
      <Fastener position="top-left" />
      <Fastener position="top" />
      <Fastener position="top-right" />

      <div class="sp-screen-stage">
        <div class="sp-screen-bezel">
          {screen()}
          <figcaption class="sp-wordmark" aria-label="EverTheme Advance Pro">
            <span class="sp-wordmark-ever" aria-hidden="true">EverTheme</span>
            <span class="sp-wordmark-advance" aria-hidden="true">Advance</span>
            <span class="sp-wordmark-pro" aria-hidden="true">PRO</span>
          </figcaption>
        </div>
      </div>

      <Fastener position="bottom-left" />
      <Fastener position="bottom-right" />
    </figure>
  );
};

export default SpPreviewFrame;
