// ╭────────────────────────────╮
// │  Display Formatting        │
// │  Keeps shared UI values    │
// │  compact and consistent.   │
// ╰────────────────────────────╯

export const formatBytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
