import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    serviceWorkers: "block",
    locale: "it-IT",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "phone",
      testIgnore: /pwa\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "tablet",
      testIgnore: /pwa\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
      },
    },
    {
      name: "pwa",
      testMatch: /pwa\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        serviceWorkers: "allow",
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173/",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
