import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "lcov", "json-summary"],
      reportsDirectory: "reports/unit/coverage",
      include: ["danger/**/*.ts", "scripts/**/*.ts"],
    },
  },
});
