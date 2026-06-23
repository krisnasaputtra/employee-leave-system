import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Employee Leave System E2E tests.
 *
 * Prerequisites:
 * 1. npm run dev (or npm run build && npm start)
 * 2. Supabase project with test users provisioned
 * 3. Set E2E_BASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD,
 *    E2E_EMPLOYEE_EMAIL, E2E_EMPLOYEE_PASSWORD,
 *    E2E_MANAGER_EMAIL, E2E_MANAGER_PASSWORD
 *    in .env.local or environment
 *
 * Run: npx playwright test
 * Report: npx playwright show-report
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
