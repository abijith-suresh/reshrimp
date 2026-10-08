import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4322",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testMatch: [
        "**/image-workflow.spec.ts",
        "**/background-removal.spec.ts",
        "**/codec-compatibility.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testMatch: ["**/image-workflow.spec.ts", "**/codec-compatibility.spec.ts"],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chromium",
      testMatch: [
        "**/image-workflow.spec.ts",
        "**/mobile-controls.spec.ts",
        "**/marketing-interactions.spec.ts",
      ],
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "bun run preview --host 127.0.0.1 --port 4322 --ignore-lock",
    url: "http://127.0.0.1:4322/app",
    reuseExistingServer: false,
  },
});
