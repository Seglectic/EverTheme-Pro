// ╭─────────────────────────────╮
// │  Vite Configuration         │
// │  Builds and tests the local │
// │  browser theme studio.      │
// ╰─────────────────────────────╯

import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    allowedHosts: ["nomara.local"],
  },
  test: {
    environment: "node",
  },
});
