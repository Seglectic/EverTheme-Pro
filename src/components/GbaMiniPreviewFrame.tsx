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

  const updateReflection: JSX.EventHandlerUnion<HTMLElement, PointerEvent> = (event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100));
    const y = Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100));
    event.currentTarget.style.setProperty("--mini-reflect-x", `${x.toFixed(1)}%`);
    event.currentTarget.style.setProperty("--mini-reflect-y", `${y.toFixed(1)}%`);
    event.currentTarget.classList.add("is-reflecting");
  };

  const resetReflection: JSX.EventHandlerUnion<HTMLElement, PointerEvent> = (event) => {
    event.currentTarget.style.setProperty("--mini-reflect-x", "50%");
    event.currentTarget.style.setProperty("--mini-reflect-y", "50%");
    event.currentTarget.classList.remove("is-reflecting");
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
        <svg class="gba-mini-lens-shape" viewBox="0 0 292 248" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="mini-lens-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#25272a" />
              <stop offset="0.42" stop-color="#0c0d0f" />
              <stop offset="1" stop-color="#17181b" />
            </linearGradient>
            <radialGradient id="mini-lens-sheen" cx="0.35" cy="0.08" r="0.72">
              <stop offset="0" stop-color="#ffffff" stop-opacity="0.11" />
              <stop offset="0.52" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
          </defs>
          <path
            class="gba-mini-lens-body"
            d="M34 5C92-1 200-1 258 5C276 7 282 17 285 34C291 72 292 152 289 190C287 215 277 229 257 237C210 251 82 251 35 237C15 229 5 215 3 190C0 152 1 72 7 34C10 17 16 7 34 5Z"
            fill="url(#mini-lens-glass)"
          />
          <path
            d="M34 6C92 0 200 0 258 6C276 8 281 18 284 35C289 72 290 151 287 189C285 213 276 227 256 235C209 248 83 248 36 235C16 227 7 213 5 189C2 151 3 72 8 35C11 18 16 8 34 6Z"
            fill="url(#mini-lens-sheen)"
          />
        </svg>
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
        <figcaption
          class="gba-mini-wordmark"
          aria-label="EverTheme Advance Mini"
          onPointerMove={updateReflection}
          onPointerLeave={resetReflection}
        >
          <strong aria-hidden="true">EverTheme</strong>
          <span aria-hidden="true">ADVANCE</span>
          <small aria-hidden="true">MINI</small>
        </figcaption>
      </div>
    </figure>
  );
};

export default GbaMiniPreviewFrame;
