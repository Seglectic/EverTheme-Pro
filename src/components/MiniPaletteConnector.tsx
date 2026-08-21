// ╭──────────────────────────────╮
// │  Mini Palette Connector      │
// │  Links a hovered swatch to   │
// │  its live preview target.    │
// ╰──────────────────────────────╯

import { createEffect, createSignal, onCleanup, onMount, Show, type Component } from "solid-js";
import { buildConnectorPoints, type ConnectorPoint, type ConnectorRect } from "../mini/connectorGeometry";
import type { MiniPalette, MiniPaletteRole } from "../mini/palette";

type MiniPaletteConnectorProps = {
  role?: MiniPaletteRole;
  colors: MiniPalette;
};

const relativeRect = (rect: DOMRect, root: DOMRect): ConnectorRect => ({
  top: rect.top - root.top,
  right: rect.right - root.left,
  bottom: rect.bottom - root.top,
  left: rect.left - root.left,
  width: rect.width,
  height: rect.height,
});

const MiniPaletteConnector: Component<MiniPaletteConnectorProps> = (props) => {
  const [points, setPoints] = createSignal<ConnectorPoint[]>([]);
  let frame = 0;

  const update = () => {
    const role = props.role;
    const root = document.querySelector<HTMLElement>("#mini-workspace");
    const source = role ? root?.querySelector<HTMLElement>(`[data-mini-palette-source="${role}"]`) : undefined;
    const target = role ? root?.querySelector<HTMLElement>(`[data-mini-role-target="${role}"]`) : undefined;
    if (!root || !source || !target) {
      setPoints([]);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const path = buildConnectorPoints(
      relativeRect(source.getBoundingClientRect(), rootRect),
      relativeRect(target.getBoundingClientRect(), rootRect),
    );
    setPoints(path);
  };

  const scheduleUpdate = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };

  createEffect(() => {
    const role = props.role;
    setPoints([]);
    if (role) scheduleUpdate();
  });

  onMount(() => {
    const root = document.querySelector<HTMLElement>("#mini-workspace");
    const observer = new ResizeObserver(scheduleUpdate);
    if (root) observer.observe(root);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    onCleanup(() => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      cancelAnimationFrame(frame);
    });
  });

  const pointString = () => points().map((point) => `${point.x},${point.y}`).join(" ");
  const arrowTransform = () => {
    const path = points();
    const end = path.at(-1);
    const previous = path.at(-2);
    if (!end || !previous) return "";
    const angle = Math.atan2(end.y - previous.y, end.x - previous.x) * 180 / Math.PI;
    return `translate(${end.x} ${end.y}) rotate(${angle})`;
  };

  return (
    <Show keyed when={props.role}>
      {(role) => (
        <Show when={points().length > 1}>
          <svg
            class="mini-palette-connector"
            style={{ "--mini-connector-color": props.colors[role] }}
            aria-hidden="true"
          >
            <polyline class="mini-palette-connector-shadow" points={pointString()} pathLength="1" />
            <polyline class="mini-palette-connector-line" points={pointString()} pathLength="1" />
            <g class="mini-palette-connector-arrow" transform={arrowTransform()}>
              <path class="mini-palette-connector-arrow-shadow" d="M1 0L-10-6L-10 6Z" />
              <path class="mini-palette-connector-arrow-fill" d="M0 0L-8-4.5L-8 4.5Z" />
            </g>
          </svg>
        </Show>
      )}
    </Show>
  );
};

export default MiniPaletteConnector;
