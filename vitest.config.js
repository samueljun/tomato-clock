import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,ts}"],
      exclude: ["src/**/*.test.{js,ts}", "src/assets/**"],
      reporter: ["text", "html"],
    },
  },
});
