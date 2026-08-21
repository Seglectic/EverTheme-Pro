// ╭──────────────────────────────╮
// │  Shared Color Picker         │
// │  Provides a consistent HSV   │
// │  palette editor in-app.      │
// ╰──────────────────────────────╯

import { createEffect, createMemo, createSignal, onCleanup, onMount, Show, type Component, type JSX } from "solid-js";
import {
  contrastRatio,
  gbaChannelsToHex,
  hexToGbaChannels,
  quantizeGbaColor,
  type GbaColorChannels,
} from "../lib/gbaColor";

type HsvColor = {
  h: number;
  s: number;
  v: number;
};

type ColorPickerProps = {
  label: string;
  value: string;
  contrastColor?: string;
  contrastLabel?: string;
  onInput: (value: string) => void;
  onClose: () => void;
};

const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

const normalizeHex = (value: string) => {
  const compact = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(compact)) return `#${compact.split("").map((digit) => digit.repeat(2)).join("")}`.toUpperCase();
  if (/^[\da-f]{6}$/i.test(compact)) return `#${compact}`.toUpperCase();
  return undefined;
};

const hexToHsv = (hex: string): HsvColor => {
  const packed = Number.parseInt(hex.slice(1), 16);
  const red = ((packed >> 16) & 0xff) / 255;
  const green = ((packed >> 8) & 0xff) / 255;
  const blue = (packed & 0xff) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    h: hue < 0 ? hue + 360 : hue,
    s: maximum ? delta / maximum : 0,
    v: maximum,
  };
};

const hsvToRgb = ({ h, s, v }: HsvColor) => {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs(section % 2 - 1));
  const match = v - chroma;
  const [red, green, blue] = section < 1 ? [chroma, x, 0]
    : section < 2 ? [x, chroma, 0]
      : section < 3 ? [0, chroma, x]
        : section < 4 ? [0, x, chroma]
          : section < 5 ? [x, 0, chroma]
            : [chroma, 0, x];
  return [red, green, blue].map((value) => Math.round((value + match) * 255));
};

const rgbToHex = (channels: number[]) => `#${channels
  .map((channel) => channel.toString(16).padStart(2, "0"))
  .join("")}`.toUpperCase();

const hsvToHex = (color: HsvColor) => rgbToHex(hsvToRgb(color));

const paintHardwareSurface = (canvas: HTMLCanvasElement, hue: number) => {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const rgb = hsvToRgb({
        h: hue,
        s: x / (canvas.width - 1),
        v: 1 - y / (canvas.height - 1),
      }).map((channel) => {
        const fiveBit = channel >> 3;
        return (fiveBit << 3) | (fiveBit >> 2);
      });
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = rgb[0];
      image.data[offset + 1] = rgb[1];
      image.data[offset + 2] = rgb[2];
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
};

const ColorPicker: Component<ColorPickerProps> = (props) => {
  const [hsv, setHsv] = createSignal(hexToHsv(props.value));
  const [hexDraft, setHexDraft] = createSignal(props.value.toUpperCase());
  let picker: HTMLDivElement | undefined;
  let surface: HTMLDivElement | undefined;
  let surfaceCanvas: HTMLCanvasElement | undefined;
  let emittedValue: string | undefined;
  let paintedHue = -1;

  createEffect(() => {
    const normalized = normalizeHex(props.value);
    if (!normalized) return;
    if (normalized === emittedValue) {
      emittedValue = undefined;
      setHexDraft(normalized);
      return;
    }
    emittedValue = undefined;
    setHsv(hexToHsv(normalized));
    setHexDraft(normalized);
  });

  createEffect(() => {
    const hue = Math.round(hsv().h);
    if (!surfaceCanvas || hue === paintedHue) return;
    paintedHue = hue;
    paintHardwareSurface(surfaceCanvas, hue);
  });

  onMount(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (target.closest("[data-palette-source]")) return;
      if (picker && !picker.contains(target)) props.onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    onCleanup(() => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    });
  });

  const applyHsv = (next: HsvColor) => {
    const hardwareColor = quantizeGbaColor(hsvToHex(next)).toUpperCase();
    const snapped = hexToHsv(hardwareColor);
    if (!snapped.s) snapped.h = next.h;
    emittedValue = hardwareColor;
    setHsv(snapped);
    setHexDraft(hardwareColor);
    props.onInput(hardwareColor);
  };

  const applyChannels = (channel: keyof GbaColorChannels, value: string) => {
    const channels = hexToGbaChannels(props.value);
    channels[channel] = clamp(Number(value) || 0, 0, 31);
    applyHsv(hexToHsv(gbaChannelsToHex(channels)));
  };

  const updateSurface = (event: PointerEvent) => {
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    applyHsv({
      ...hsv(),
      s: clamp((event.clientX - bounds.left) / bounds.width),
      v: 1 - clamp((event.clientY - bounds.top) / bounds.height),
    });
  };

  const startSurfaceDrag: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSurface(event);
  };

  const moveSurfaceDrag: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSurface(event);
  };

  const nudgeSurface: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (event) => {
    const next = { ...hsv() };
    if (event.key === "ArrowLeft") next.s = clamp(next.s - .01);
    else if (event.key === "ArrowRight") next.s = clamp(next.s + .01);
    else if (event.key === "ArrowUp") next.v = clamp(next.v + .01);
    else if (event.key === "ArrowDown") next.v = clamp(next.v - .01);
    else return;
    event.preventDefault();
    applyHsv(next);
  };

  const commitHex = () => {
    const normalized = normalizeHex(hexDraft());
    if (!normalized) {
      setHexDraft(props.value.toUpperCase());
      return;
    }
    applyHsv(hexToHsv(normalized));
  };

  const channels = createMemo(() => hexToGbaChannels(props.value));
  const contrast = createMemo(() => props.contrastColor ? contrastRatio(props.value, props.contrastColor) : undefined);

  return (
    <div ref={picker} class="palette-color-picker" role="dialog" aria-label={`${props.label} color picker`}>
      <header>
        <div><strong>{props.label}</strong><small>GBA · BGR555</small></div>
        <button type="button" aria-label="Close color picker" onClick={props.onClose}>×</button>
      </header>
      <div
        ref={surface}
        class="palette-color-surface"
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuetext={`${Math.round(hsv().s * 100)}% saturation, ${Math.round(hsv().v * 100)}% brightness`}
        onPointerDown={startSurfaceDrag}
        onPointerMove={moveSurfaceDrag}
        onKeyDown={nudgeSurface}
      >
        <canvas ref={surfaceCanvas} width="128" height="69" aria-hidden="true" />
        <i style={{ left: `${hsv().s * 100}%`, top: `${(1 - hsv().v) * 100}%` }} />
      </div>
      <label class="palette-color-hue">
        <span>Hue</span>
        <input
          type="range"
          min="0"
          max="359"
          value={Math.round(hsv().h)}
          aria-label="Hue"
          onInput={(event) => applyHsv({ ...hsv(), h: Number(event.currentTarget.value) })}
        />
      </label>
      <div class="palette-gba-channels" aria-label="Five-bit GBA color channels">
        <label><span>R</span><input type="number" min="0" max="31" value={channels().red} onInput={(event) => applyChannels("red", event.currentTarget.value)} /><small>/31</small></label>
        <label><span>G</span><input type="number" min="0" max="31" value={channels().green} onInput={(event) => applyChannels("green", event.currentTarget.value)} /><small>/31</small></label>
        <label><span>B</span><input type="number" min="0" max="31" value={channels().blue} onInput={(event) => applyChannels("blue", event.currentTarget.value)} /><small>/31</small></label>
      </div>
      <label class="palette-color-hex">
        <i style={{ background: props.value }} aria-hidden="true" />
        <span class="visually-hidden">Hex color</span>
        <input
          type="text"
          value={hexDraft()}
          inputMode="text"
          spellcheck={false}
          maxLength={7}
          aria-label="Hex color"
          onInput={(event) => setHexDraft(event.currentTarget.value)}
          onChange={commitHex}
          onBlur={commitHex}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitHex();
          }}
        />
      </label>
      <Show when={contrast()}>
        {(ratio) => (
          <div class="palette-color-contrast" classList={{ "is-low": ratio() < 4.5 }}>
            <span>Contrast vs {props.contrastLabel}</span>
            <strong>{ratio().toFixed(1)}:1</strong>
            <em>{ratio() >= 4.5 ? "Clear" : "Low"}</em>
          </div>
        )}
      </Show>
    </div>
  );
};

export default ColorPicker;
