// ╭──────────────────────────────╮
// │  GBA Canvas Preview          │
// │  Renders the real 8×8 font   │
// │  atlas and scrolling stage.  │
// ╰──────────────────────────────╯

import { createEffect, createSignal, onCleanup, type Component } from "solid-js";
import { createPreviewFileList, previewRowAtCanvasPoint, type PreviewFile } from "../lib/previewGames";
import type { PixelImage, RegionSettings, ThemeSettings } from "../types";
import SpPreviewFrame from "./SpPreviewFrame";

type ThemePreviewProps = {
  settings: ThemeSettings;
  background?: PixelImage;
  font?: PixelImage;
};

type FontAtlases = {
  text: HTMLCanvasElement;
  directory: HTMLCanvasElement;
  selection: HTMLCanvasElement;
};

const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const colorChannels = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
};

function makeImageCanvas(image: PixelImage) {
  const canvas = makeCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.putImageData(new ImageData(Uint8ClampedArray.from(image.data), image.width, image.height), 0, 0);
  return canvas;
}

function makeTintedFont(font: PixelImage, color: string) {
  const canvas = makeCanvas(128, 64);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  const output = context.createImageData(128, 64);
  const [red, green, blue] = colorChannels(color);
  const background = [font.data[0] >> 3, font.data[1] >> 3, font.data[2] >> 3];

  for (let source = 0, target = 0; source < font.data.length; source += 4, target += 4) {
    const transparent =
      (font.data[source] >> 3) === background[0]
      && (font.data[source + 1] >> 3) === background[1]
      && (font.data[source + 2] >> 3) === background[2];
    output.data[target] = red;
    output.data[target + 1] = green;
    output.data[target + 2] = blue;
    output.data[target + 3] = transparent ? 0 : 255;
  }
  context.putImageData(output, 0, 0);
  return canvas;
}

function drawText(context: CanvasRenderingContext2D, atlas: HTMLCanvasElement, text: string, x: number, y: number) {
  for (let index = 0; index < text.length; index += 1) {
    const glyph = (text.charCodeAt(index) - 0x20) & 0x7f;
    context.drawImage(atlas, (glyph % 16) * 8, Math.floor(glyph / 16) * 8, 8, 8, x + index * 8, y, 8, 8);
  }
}

function paintPixelBorder(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  context.fillStyle = color;
  context.fillRect(x + 1, y, width - 2, 1);
  context.fillRect(x + 1, y + height - 1, width - 2, 1);
  context.fillRect(x, y + 1, 1, height - 2);
  context.fillRect(x + width - 1, y + 1, 1, height - 2);
}

function paintRegion(context: CanvasRenderingContext2D, region: RegionSettings, fill: string, border: string) {
  const x = region.x * 8;
  const y = region.y * 8;
  const width = region.width * 8;
  const height = region.height * 8;

  if (region.style === 3) {
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
  } else if (region.style === 9 || region.style === 13) {
    context.fillStyle = "rgba(0, 0, 0, 0.52)";
    context.fillRect(x, y, width, height);
    if (region.style === 13) paintPixelBorder(context, x, y, width, height, border);
  }
}

function paintBackground(
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement | undefined,
  baseColor: string,
  offsetX: number,
  offsetY: number,
) {
  context.fillStyle = baseColor;
  context.fillRect(0, 0, 240, 160);
  if (!source) return;

  const wrappedX = ((offsetX % source.width) + source.width) % source.width;
  const wrappedY = ((offsetY % source.height) + source.height) % source.height;
  for (let y = -wrappedY; y < 160; y += source.height) {
    for (let x = -wrappedX; x < 240; x += source.width) context.drawImage(source, Math.round(x), Math.round(y));
  }
}

function paintMenu(
  context: CanvasRenderingContext2D,
  settings: ThemeSettings,
  atlases: FontAtlases | undefined,
  entries: PreviewFile[],
  selectedRow: number,
) {
  const { header, footer, files, colors } = settings;
  if (header.style !== 0) {
    paintRegion(context, header, colors.chrome, colors.text);
    if (atlases) drawText(context, atlases.text, "page: 1 of 1", (header.x + header.textX) * 8, (header.y + header.textY) * 8);
  }

  if (files.style !== 0) paintRegion(context, files, colors.chrome, colors.text);
  const startX = (files.x + files.textX) * 8;
  const startY = (files.y + files.textY) * 8;
  const visibleRows = Math.max(0, Math.min(entries.length, files.height - files.textY));
  for (let row = 0; row < visibleRows; row += 1) {
    const y = startY + row * 8;
    if (row === selectedRow) {
      context.fillStyle = colors.selection;
      context.fillRect(files.x * 8, y, files.width * 8, 8);
    }
    if (!atlases) continue;
    const entry = entries[row];
    const atlas = row === selectedRow ? atlases.selection : entry.directory ? atlases.directory : atlases.text;
    drawText(context, atlas, entry.name, startX, y);
  }

  if (footer.style !== 0) {
    paintRegion(context, footer, colors.chrome, colors.text);
    if (atlases) drawText(context, atlases.text, entries[selectedRow].name, (footer.x + footer.textX) * 8, (footer.y + footer.textY) * 8);
  }
}

function paintPopupMenu(context: CanvasRenderingContext2D, settings: ThemeSettings, atlases: FontAtlases | undefined) {
  const { colors } = settings;
  const x = 40;
  const y = 8;
  const width = 160;
  const height = 128;
  context.fillStyle = "rgba(0, 0, 0, .45)";
  context.fillRect(x + 2, y + 2, width, height);
  context.fillStyle = colors.chrome;
  context.fillRect(x, y, width, height);
  paintPixelBorder(context, x + 4, y + 8, width - 8, height - 12, colors.text);

  context.fillStyle = colors.selection;
  context.fillRect(x + 16, y + 24, width - 32, 8);
  if (!atlases) return;
  drawText(context, atlases.text, "Main Menu", x + 44, y);
  drawText(context, atlases.selection, "Start Game", x + 40, y + 24);
  drawText(context, atlases.text, "Cheats", x + 56, y + 40);
  drawText(context, atlases.text, "Game Data", x + 44, y + 56);
  drawText(context, atlases.text, "Rom Info", x + 48, y + 72);
  drawText(context, atlases.text, "Configure", x + 44, y + 88);
  drawText(context, atlases.text, "File Ops", x + 48, y + 104);
}

const ThemePreview: Component<ThemePreviewProps> = (props) => {
  let screen!: HTMLCanvasElement;
  const [menuOpen, setMenuOpen] = createSignal(false);
  const fileList = createPreviewFileList();
  const [selectedRow, setSelectedRow] = createSignal(fileList.selectedRow);

  const selectFile = (event: MouseEvent) => {
    if (menuOpen()) return;
    const bounds = screen.getBoundingClientRect();
    const canvasX = (event.clientX - bounds.left) * (screen.width / bounds.width);
    const canvasY = (event.clientY - bounds.top) * (screen.height / bounds.height);
    const row = previewRowAtCanvasPoint(fileList.entries, props.settings.files, canvasX, canvasY);
    if (row !== undefined) setSelectedRow(row);
  };

  createEffect(() => {
    const settings = JSON.parse(JSON.stringify(props.settings)) as ThemeSettings;
    const background = props.background ? makeImageCanvas(props.background) : undefined;
    const font = props.font;
    const showPopupMenu = menuOpen();
    const atlases = font
      ? {
          text: makeTintedFont(font, settings.colors.text),
          directory: makeTintedFont(font, settings.colors.directory),
          selection: makeTintedFont(font, settings.colors.selectionText),
        }
      : undefined;
    const context = screen.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;

    let frame = 0;
    let lastTime = performance.now();
    let offsetX = 0;
    let offsetY = 0;
    const render = (time: number) => {
      const elapsedFrames = Math.min(6, (time - lastTime) / (1000 / 60));
      lastTime = time;
      offsetX += (settings.scrollX / 16) * elapsedFrames;
      offsetY += (settings.scrollY / 16) * elapsedFrames;
      paintBackground(context, background, settings.colors.background, offsetX, offsetY);
      paintMenu(context, settings, atlases, fileList.entries, selectedRow());
      if (showPopupMenu) paintPopupMenu(context, settings, atlases);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  return (
    <SpPreviewFrame menuOpen={menuOpen()} onToggleMenu={() => setMenuOpen((open) => !open)}>
      <canvas
        ref={screen}
        class="gba-screen"
        width="240"
        height="160"
        aria-label="Rendered theme screen; click a file or folder to preview its selected colors"
        onClick={selectFile}
      />
    </SpPreviewFrame>
  );
};

export default ThemePreview;
