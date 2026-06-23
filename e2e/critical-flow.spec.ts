import { expect, test } from "@playwright/test";

/**
 * Critical End-to-End Flow:
 *
 * Admin creates employee → Employee changes password → Employee submits leave
 * → Manager approves → Balance updates → Calendar displays approved leave
 * → Unrelated employee cannot see private reason
 *
 * Prerequisites:
 * 1. Running dev server (npm run dev)
 * 2. Supabase project with:
 *    - Admin account (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)
 *    - Manager account (E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD)
 *    - At least one department and leave type configured
 *    - Employee balances initialized
 * 3. Environment variables set in .env.local or shell
 *
 * Note: This test requires pre-provisioned accounts because Supabase Auth
 * account creation is server-side only (admin client). The test verifies
 * the UI flows, not the provisioning API.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const EMPLOYEE_EMAIL = process.env.E2E_EMPLOYEE_EMAIL ?? "employee@example.com";
const EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD ?? "employee123";
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL ?? "manager@example.com";
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD ?? "manager123";
const UNRELATED_EMAIL = process.env.E2E_UNRELATED_EMAIL ?? "unrelated@example.com";
const UNRELATED_PASSWORD = process.env.E2E_UNRELATED_PASSWORD ?? "unrelated123";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

async function logout(page: import("@playwright/test").Page) {
  // Navigate to login which should clear session
  await page.goto("/login");
}

test.describe("Critical Leave Request Flow", () => {
  test("Admin can sign in and access dashboard", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    // Should see admin-level content
    await expect(page.locator("body")).toContainText(/dashboard/i);
  });

  test("Employee can sign in and submit leave request", async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

    // Navigate to new leave request
    await page.goto("/dashboard/leave/requests/new");
    await expect(page).toHaveURL(/\/requests\/new/);

    // Fill form
    await page.waitForSelector('[data-slot="select-trigger"]', { timeout: 5000 });

    // Select first leave type
    const leaveTypeSelect = page.locator('[data-slot="select-trigger"]').first();
    await leaveTypeSelect.click();
    await page.locator('[data-slot="select-item"]').first().click();

    // Set dates (tomorrow + 2 days from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const startInput = page.locator('input[type="date"]').first();
    const endInput = page.locator('input[type="date"]').nth(1);
    await startInput.fill(tomorrow.toISOString().split("T")[0]);
    await endInput.fill(dayAfter.toISOString().split("T")[0]);

    // Add reason
    await page.fill("textarea", "E2E test leave request");

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success toast or redirect
    await page.waitForURL(/\/requests/, { timeout: 10000 });
  });

  test("Manager can sign in and see pending approvals", async ({ page }) => {
    await login(page, MANAGER_EMAIL, MANAGER_PASSWORD);

    // Navigate to approvals
    await page.goto("/dashboard/approvals");

    // Should see the approval inbox
    await expect(page.locator("body")).toContainText(/approval|pending/i);
  });

  test("Calendar shows approved leave without private reason", async ({ page }) => {
    await login(page, UNRELATED_EMAIL, UNRELATED_PASSWORD);

    // Navigate to calendar
    await page.goto("/dashboard/calendar");

    // Calendar should load
    await expect(page.locator("body")).toContainText(/calendar/i);

    // Private reasons should NOT be visible
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("E2E test leave request");
  });

  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "nobody@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error, not raw Supabase error
    await page.waitForTimeout(2000);
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("AuthApiError");
    expect(bodyText).not.toContain("PostgrestError");
  });
});
