  // backend/vitest.config.ts
  import { defineConfig } from "vitest/config";

  export default defineConfig({
    test: {
      globals: true,
      environment: "node",
      setupFiles: ["./src/tests/setup.ts"],
      testTimeout: 30000, // mongodb-memory-server needs time to start
    },
  });