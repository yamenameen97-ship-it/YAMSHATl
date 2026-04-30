import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../frontend/admin-panel",
    emptyOutDir: true,
  },
});
