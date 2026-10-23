import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

/* 3100 unless that port is taken on this machine: PLAYWRIGHT_PORT=3312 pnpm validate */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  outputDir: resolve(tmpdir(), "peasant-labs-project-tests"),
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // The site follows the system theme; the suite reads it in dark unless a test says otherwise.
    colorScheme: "dark",
    permissions: ["clipboard-read", "clipboard-write"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm build && pnpm start --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
