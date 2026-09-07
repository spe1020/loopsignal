import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    include: ["lib/hosted/__tests__/**/*.test.ts", "lib/workspace/__tests__/**/*.test.ts", "lib/solve/__tests__/**/*.test.ts", "lib/flow/__tests__/**/*.test.ts", "lib/loop/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
