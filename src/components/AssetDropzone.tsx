// ╭─────────────────────────────╮
// │  Asset Dropzone           │
// │  Accepts theme imagery   │
// │  with keyboard parity.   │
// ╰─────────────────────────────╯

import { createSignal, type Component, type JSX } from "solid-js";
import { Check, ImagePlus, Type } from "lucide-solid";

type AssetDropzoneProps = {
  kind: "image" | "font";
  title: string;
  description: string;
  accept: string;
  fileName?: string;
  onFile: (file: File) => void | Promise<void>;
};

const AssetDropzone: Component<AssetDropzoneProps> = (props) => {
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

  const Icon = props.kind === "image" ? ImagePlus : Type;

  return (
    <>
      <input
        ref={input}
        class="visually-hidden"
        type="file"
        accept={props.accept}
        onChange={(event) => receive(event.currentTarget.files)}
      />
      <button
        type="button"
        class="dropzone"
        classList={{ "is-dragging": dragging(), "has-file": Boolean(props.fileName) }}
        onClick={() => input.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span class="dropzone-icon">{props.fileName ? <Check size={18} /> : <Icon size={18} />}</span>
        <span class="dropzone-copy">
          <strong>{props.fileName ?? props.title}</strong>
          <small>{props.fileName ? "Click or drop to replace" : props.description}</small>
        </span>
      </button>
    </>
  );
};

export default AssetDropzone;
