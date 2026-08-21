// ╭──────────────────────────────╮
// │  EverTheme Device Modes      │
// │  Defines the products routed │
// │  through the studio shell.   │
// ╰──────────────────────────────╯

export const DEVICE_MODES = ["pro", "mini"] as const;

export type DeviceMode = (typeof DEVICE_MODES)[number];
