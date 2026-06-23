import { defineConfig } from "vitest/config";

import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
