const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./test",
  testMatch: "**/*.visual.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8788",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:8788",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  snapshotDir: "./test/snapshots",
});
