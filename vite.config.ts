// ╭─────────────────────────────╮
// │  Vite Configuration         │
// │  Builds and tests the local │
// │  browser theme studio.      │
// ╰─────────────────────────────╯

import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  base: process.env.EVERTHEME_BASE_PATH ?? "/",
  plugins: [solid()],
  server: {
    allowedHosts: ["nomara.local"],
  },
  test: {
    environment: "node",
  },
});
