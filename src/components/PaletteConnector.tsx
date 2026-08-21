// ╭──────────────────────────────╮
// │  Shared Palette Connector    │
// │  Links palette swatches to  │
// │  live preview targets.       │
// ╰──────────────────────────────╯

import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { buildConnectorPoints, type ConnectorPoint, type ConnectorRect } from "../lib/connectorGeometry";

type PaletteConnectorProps<Role extends string> = {
  rootId: string;
  role?: Role;
  colors: Record<Role, string>;
};

const relativeRect = (rect: DOMRect, root: DOMRect): ConnectorRect => ({
  top: rect.top - root.top,
  right: rect.right - root.left,
  bottom: rect.bottom - root.top,
  left: rect.left - root.left,
  width: rect.width,
  height: rect.height,
});

const targetRect = (target: HTMLElement, root: DOMRect) => {
  const rect = relativeRect(target.getBoundingClientRect(), root);
  const anchorX = Number.parseFloat(target.dataset.paletteAnchorX ?? "0.8");
  const x = rect.left + rect.width * Math.min(1, Math.max(0, anchorX));
  return { ...rect, left: x, right: x, width: 0 };
};

const contrastingShadow = (hex: string) => {
  const packed = Number.parseInt(hex.slice(1), 16);
  const red = (packed >> 16) & 0xff;
  const green = (packed >> 8) & 0xff;
  const blue = packed & 0xff;
  return red * .299 + green * .587 + blue * .114 > 145 ? "#050704" : "#F4F6E9";
};

const matchingElement = (root: HTMLElement, attribute: "source" | "target", role: string) => (
  Array.from(root.querySelectorAll<HTMLElement>(`[data-palette-${attribute}]`))
    .find((element) => element.dataset[attribute === "source" ? "paletteSource" : "paletteTarget"] === role)
);

function PaletteConnector<Role extends string>(props: PaletteConnectorProps<Role>) {
  const [points, setPoints] = createSignal<ConnectorPoint[]>([]);
  let frame = 0;

  const update = () => {
    const role = props.role;
    const root = document.getElementById(props.rootId);
    const source = role && root ? matchingElement(root, "source", role) : undefined;
    const target = role && root ? matchingElement(root, "target", role) : undefined;
    if (!root || !source || !target) {
      setPoints([]);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    setPoints(buildConnectorPoints(
      relativeRect(source.getBoundingClientRect(), rootRect),
      targetRect(target, rootRect),
    ));
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
    const root = document.getElementById(props.rootId);
    const observer = new ResizeObserver(scheduleUpdate);
    const mutations = new MutationObserver(scheduleUpdate);
    if (root) observer.observe(root);
    if (root) mutations.observe(root, {
      attributes: true,
      attributeFilter: ["style", "data-palette-target", "data-palette-anchor-x"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    onCleanup(() => {
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      cancelAnimationFrame(frame);
    });
  });

  const pointString = () => points().map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Show keyed when={props.role}>
      {(role) => (
        <Show when={points().length > 1}>
          <svg
            class="palette-connector"
            style={{
              "--palette-connector-color": props.colors[role],
              "--palette-connector-contrast": contrastingShadow(props.colors[role]),
            }}
            aria-hidden="true"
          >
            <polyline class="palette-connector-line" points={pointString()} pathLength="1" />
          </svg>
        </Show>
      )}
    </Show>
  );
}

export default PaletteConnector;
