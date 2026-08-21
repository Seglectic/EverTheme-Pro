// ╭──────────────────────────────╮
// │  GBA Mini Editor State       │
// │  Keeps user ROM bytes local  │
// │  identification and output.  │
// ╰──────────────────────────────╯

import { createMemo, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { prepareMiniBackground } from "../lib/image";
import type { PixelImage } from "../types";
import { identifyGbaOs, type MiniRomIdentification } from "../mini/romIdentity";
import { encodeMiniBackground, encodeMiniSolidBackground, type MiniBackgroundAssets } from "../mini/miniBackground";
import { patchGbaOsBackground } from "../mini/patchGbaOsBackground";
import {
  miniPalettePreset,
  STOCK_MINI_PALETTE,
  type MiniPalette,
  type MiniPalettePresetId,
  type MiniPaletteRole,
} from "../mini/palette";
import { quantizeMiniColor } from "../mini/gbaColor";
import { patchGbaOsPalette } from "../mini/patchGbaOs";

export type MiniRomLoadState = "idle" | "checking" | "checked" | "error";

const DOWNLOAD_ROM_NAME = "GBAOS.gba";

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const createMiniEditor = () => {
  const [fileName, setFileName] = createSignal("");
  const [rom, setRom] = createSignal<Uint8Array>();
  const [identification, setIdentification] = createSignal<MiniRomIdentification>();
  const [loadState, setLoadState] = createSignal<MiniRomLoadState>("idle");
  const [loadError, setLoadError] = createSignal("");
  const [message, setMessage] = createSignal("Design now · drop stock GBAOS v1.17 when ready to download.");
  const [background, setBackground] = createSignal<PixelImage>();
  const [backgroundAssets, setBackgroundAssets] = createSignal<MiniBackgroundAssets>();
  const [backgroundName, setBackgroundName] = createSignal("");
  const [palette, setPalette] = createStore<MiniPalette>({ ...STOCK_MINI_PALETTE });
  let requestId = 0;

  const hasSolidBackground = createMemo(() => palette.background !== STOCK_MINI_PALETTE.background);
  const effectiveBackgroundAssets = createMemo(() => (
    backgroundAssets() ?? (hasSolidBackground() ? encodeMiniSolidBackground(palette.background) : undefined)
  ));
  const hasBackground = createMemo(() => Boolean(effectiveBackgroundAssets()));

  const patchResult = createMemo(() => {
    const source = rom();
    if (!source || identification()?.kind !== "supported") return undefined;
    return patchGbaOsPalette(source, palette);
  });

  const handleRom = async (file: File) => {
    const currentRequest = ++requestId;
    setFileName(file.name);
    setRom(undefined);
    setIdentification(undefined);
    setLoadError("");
    setLoadState("checking");
    setMessage("Checking ROM identity…");

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await identifyGbaOs(bytes);
      if (currentRequest !== requestId) return;
      setRom(bytes);
      setIdentification(result);
      setLoadState("checked");
      setMessage(result.reason);
    } catch (error) {
      if (currentRequest !== requestId) return;
      setLoadError(error instanceof Error ? error.message : "The ROM could not be read.");
      setLoadState("error");
      setMessage("The ROM could not be read.");
    }
  };

  const setColor = (role: MiniPaletteRole, value: string) => {
    setPalette(role, quantizeMiniColor(value));
    setMessage(role === "background" && backgroundName()
      ? "Solid background updated · remove the loaded image to reveal it."
      : "Palette updated · GBA colors are quantized to 15-bit.");
  };

  const setPalettePreset = (id: MiniPalettePresetId) => {
    const preset = miniPalettePreset(id);
    setPalette({ ...preset.colors });
    setMessage(`${preset.label} palette loaded.`);
  };

  const handleBackground = async (file: File) => {
    try {
      setMessage("Optimizing image for the GBA Mini…");
      const prepared = await prepareMiniBackground(file);
      const assets = encodeMiniBackground(prepared);
      setBackground(prepared);
      setBackgroundAssets(assets);
      setBackgroundName(file.name);
      setMessage(`Image ready · 224×144 · ${assets.colorCount} GBA colors`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not process that image.");
    }
  };

  const clearBackground = () => {
    setBackground(undefined);
    setBackgroundAssets(undefined);
    setBackgroundName("");
    setMessage(hasSolidBackground() ? "Using the solid background color." : "Image removed · choose a solid background color or add another image.");
  };

  const downloadRom = () => {
    const source = rom();
    const version = identification()?.version;
    const assets = effectiveBackgroundAssets();
    if (!source || identification()?.kind !== "supported" || !version) {
      setMessage("Drop a recognized stock GBAOS v1.17 ROM before downloading.");
      return;
    }
    try {
      const themed = patchGbaOsPalette(source, palette);
      if (!themed.changes.length && !assets) {
        setMessage("Add a background image or change at least one palette color before downloading.");
        return;
      }
      const bytes = assets ? patchGbaOsBackground(themed.bytes, assets).bytes : themed.bytes;
      downloadBlob(new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" }), DOWNLOAD_ROM_NAME);
      const backgroundDescription = assets && (backgroundName() ? "image background" : "solid background");
      const contents = [backgroundDescription, themed.changes.length && `${themed.changes.length} palette roles`].filter(Boolean).join(" + ");
      setMessage(`${DOWNLOAD_ROM_NAME} downloaded · ${contents} · ready to copy to the card.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The patched GBAOS ROM could not be downloaded.");
    }
  };

  const reset = () => {
    requestId += 1;
    setFileName("");
    setRom(undefined);
    setIdentification(undefined);
    setLoadError("");
    setLoadState("idle");
    setMessage("Design now · drop stock GBAOS v1.17 when ready to download.");
    setBackground(undefined);
    setBackgroundAssets(undefined);
    setBackgroundName("");
    setPalette({ ...STOCK_MINI_PALETTE });
  };

  return {
    fileName,
    rom,
    identification,
    loadState,
    loadError,
    message,
    background,
    backgroundAssets: effectiveBackgroundAssets,
    backgroundName,
    hasBackground,
    palette,
    patchResult,
    handleRom,
    handleBackground,
    clearBackground,
    setColor,
    setPalettePreset,
    downloadRom,
    reset,
  };
};
