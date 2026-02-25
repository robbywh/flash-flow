import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/router.tsx",
        "src/routeTree.gen.ts",
        "src/routes/__root.tsx",
        "**/*.spec.{ts,tsx}",
        "**/*.types.ts",
        "**/types/**",
        "**/index.ts",
        "**/flash-sale.api.ts",
      ],
    },
  },
});
