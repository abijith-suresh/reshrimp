import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* Run tests in dev server */
  webServer: {
    command: "bun run dev --port 4322",
    port: 4322,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  use: {
    baseURL: "http://localhost:4322",
  },
});
