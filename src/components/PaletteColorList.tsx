// ╭──────────────────────────────╮
// │  Shared Palette Controls     │
// │  Coordinates color rows, the│
// │  picker, and active targets. │
// ╰──────────────────────────────╯

import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import ColorPicker from "./ColorPicker";

export type PaletteColorItem<Role extends string> = {
  role: Role;
  label: string;
  contrastWith?: Role;
};

type PaletteColorListProps<Role extends string> = {
  items: ReadonlyArray<PaletteColorItem<Role>>;
  colors: Record<Role, string>;
  onColor: (role: Role, value: string) => void;
  onActiveRole?: (role?: Role) => void;
};

function PaletteColorList<Role extends string>(props: PaletteColorListProps<Role>) {
  const [hoveredRole, setHoveredRole] = createSignal<Role>();
  const [focusedRole, setFocusedRole] = createSignal<Role>();
  const [openRole, setOpenRole] = createSignal<Role>();

  createEffect(() => {
    const roles = new Set(props.items.map((item) => item.role));
    if (hoveredRole() && !roles.has(hoveredRole()!)) setHoveredRole();
    if (focusedRole() && !roles.has(focusedRole()!)) setFocusedRole();
    if (openRole() && !roles.has(openRole()!)) setOpenRole();
  });
  createEffect(() => props.onActiveRole?.(openRole() ?? hoveredRole() ?? focusedRole()));
  onCleanup(() => props.onActiveRole?.());

  return (
    <div class="color-list palette-color-list">
      <For each={props.items}>
        {(item) => (
          <div
            class="color-row palette-color-row"
            onPointerEnter={() => setHoveredRole(() => item.role)}
            onPointerLeave={() => setHoveredRole()}
          >
            <button
              class="palette-color-swatch"
              type="button"
              style={{ background: props.colors[item.role] }}
              data-palette-source={item.role}
              aria-label={`Edit ${item.label} color`}
              aria-expanded={openRole() === item.role}
              onClick={() => setOpenRole((current) => current === item.role ? undefined : item.role)}
              onFocus={() => setFocusedRole(() => item.role)}
              onBlur={() => setFocusedRole()}
            >
              <span class="visually-hidden">Edit {item.label} color</span>
            </button>
            <span>{item.label}</span>
            <code>{props.colors[item.role].toUpperCase()}</code>
            <Show when={openRole() === item.role}>
              <ColorPicker
                label={item.label}
                value={props.colors[item.role]}
                contrastColor={item.contrastWith ? props.colors[item.contrastWith] : undefined}
                contrastLabel={item.contrastWith
                  ? props.items.find((candidate) => candidate.role === item.contrastWith)?.label
                  : undefined}
                onInput={(value) => props.onColor(item.role, value)}
                onClose={() => setOpenRole()}
              />
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

export default PaletteColorList;
