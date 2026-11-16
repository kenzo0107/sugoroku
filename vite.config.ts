import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: { main: "index.html", japan: "japan.html" },
    },
  },
  test: {
    environment: "jsdom",
  },
});
