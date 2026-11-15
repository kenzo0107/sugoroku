import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        checklist: "checklist.html",
      },
    },
  },
  test: {
    environment: "jsdom",
  },
});
