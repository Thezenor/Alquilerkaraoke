import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // 1 reintento: varios tests mutan la config singleton (SiteConfig) y al correr en
  // paralelo pueden cruzarse puntualmente; el reintento absorbe ese flake transitorio.
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
