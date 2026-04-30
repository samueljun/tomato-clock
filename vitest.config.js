import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,ts}"],
      exclude: ["src/**/*.test.{js,ts}", "src/assets/**"],
      reporter: ["text", "html"],
    },
  },
});
