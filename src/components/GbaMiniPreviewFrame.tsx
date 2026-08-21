// ╭──────────────────────────────╮
// │  GBA Mini Preview Frame      │
// │  Houses Mini menus and owns  │
// │  the screen ROM drop target. │
// ╰──────────────────────────────╯

import { children, createSignal, type Component, type JSX } from "solid-js";
import type { MiniRomLoadState } from "../editor/createMiniEditor";
import "../mini-preview.css";

type GbaMiniPreviewFrameProps = {
  children: JSX.Element;
  fileName: string;
  loadState: MiniRomLoadState;
  onFile: (file: File) => void | Promise<void>;
};

const GbaMiniPreviewFrame: Component<GbaMiniPreviewFrameProps> = (props) => {
  const screen = children(() => props.children);
  const [dragging, setDragging] = createSignal(false);
  let input!: HTMLInputElement;

  const receive = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void props.onFile(file);
  };

  const onDrop: JSX.EventHandlerUnion<HTMLButtonElement, DragEvent> = (event) => {
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer?.files ?? null);
  };

  return (
    <figure class="gba-mini-frame" aria-label="Original Game Boy Advance-styled Mini menu preview">
      <input
        ref={input}
        class="visually-hidden"
        type="file"
        accept=".gba,application/octet-stream"
        onChange={(event) => {
          receive(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      <div class="gba-mini-lens">
        <span class="gba-mini-power" aria-hidden="true">
          <i /> POWER
        </span>
        <button
          class="gba-mini-screen-stage"
          classList={{ "is-dragging": dragging(), "is-checking": props.loadState === "checking" }}
          type="button"
          aria-label={props.fileName ? "Replace GBAOS ROM" : "Drop or choose GBAOS ROM"}
          disabled={props.loadState === "checking"}
          onClick={() => input.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {screen()}
          <span class="gba-mini-screen-drop-hint" aria-hidden="true">
            {props.loadState === "checking" ? "CHECKING GBAOS…" : props.fileName ? "DROP TO REPLACE GBAOS" : "DROP GBAOS.GBA HERE"}
          </span>
        </button>
        <figcaption class="gba-mini-wordmark" aria-label="EverTheme Advance Mini">
          <strong aria-hidden="true">EverTheme</strong>
          <span aria-hidden="true">ADVANCE</span>
          <small aria-hidden="true">MINI / X5</small>
        </figcaption>
      </div>
    </figure>
  );
};

export default GbaMiniPreviewFrame;
