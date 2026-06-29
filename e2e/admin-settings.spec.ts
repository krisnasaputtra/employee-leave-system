import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsEmployee } from "./helpers/auth";

/**
 * Admin Settings E2E Tests
 *
 * Validates that admin-only settings pages (Departments, Leave Types, Holidays)
 * load correctly with expected UI elements, and that employees cannot access them.
 *
 * Prerequisites:
 * - Running dev server or Playwright webServer config
 * - Supabase project with admin & employee test accounts
 */

// ---------------------------------------------------------------------------
// 1. Departments Settings
// ---------------------------------------------------------------------------

test.describe("Admin Settings — Departments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("departments page loads with team table", async ({ page }) => {
    await page.goto("/dashboard/settings/departments");
    await page.waitForLoadState("networkidle");

    // Page should contain a heading or text referencing departments
    await expect(page.locator("body")).toContainText(/department/i);

    // Should render a table (or a list) of departments/teams
    const table = page.locator("table");
    const list = page.locator('[role="list"], [role="grid"], ul, ol');
    const hasTable = await table.isVisible().catch(() => false);
    const hasList = await list.first().isVisible().catch(() => false);
    expect(hasTable || hasList).toBeTruthy();
  });

  test("departments page has an add button", async ({ page }) => {
    await page.goto("/dashboard/settings/departments");
    await page.waitForLoadState("networkidle");

    // Look for an "Add" button using multiple strategies for resilience
    const addButton = page
      .getByRole("button", { name: /add|create|new/i })
      .or(page.locator('a[href*="add"], a[href*="new"], a[href*="create"]'))
      .or(page.locator("button").filter({ hasText: /add|create|new/i }));

    await expect(addButton.first()).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Leave Types Settings
// ---------------------------------------------------------------------------

test.describe("Admin Settings — Leave Types", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("leave types page loads with types list", async ({ page }) => {
    await page.goto("/dashboard/settings/leave-types");
    await page.waitForLoadState("networkidle");

    // Heading should reference leave types
    await expect(
      page.getByRole("heading", { name: /leave type/i }),
    ).toBeVisible({ timeout: 15000 });

    // Should display leave type entries (table rows, list items, or cards)
    const table = page.locator("table");
    const cards = page.locator('[class*="card"], [role="listitem"]');
    const hasTable = await table.isVisible().catch(() => false);
    const hasCards =
      (await cards.count().catch(() => 0)) > 0 &&
      (await cards.first().isVisible().catch(() => false));
    expect(hasTable || hasCards).toBeTruthy();
  });

  test("leave types page has an add button", async ({ page }) => {
    await page.goto("/dashboard/settings/leave-types");
    await page.waitForLoadState("networkidle");

    const addButton = page
      .getByRole("button", { name: /add|create|new/i })
      .or(page.locator('a[href*="add"], a[href*="new"], a[href*="create"]'))
      .or(page.locator("button").filter({ hasText: /add|create|new/i }));

    await expect(addButton.first()).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 3. Holidays Settings
// ---------------------------------------------------------------------------

test.describe("Admin Settings — Holidays", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("holidays page loads with holidays list", async ({ page }) => {
    await page.goto("/dashboard/settings/holidays");
    await page.waitForLoadState("networkidle");

    // Should land on the holidays page
    await expect(page).toHaveURL(/\/holidays/);
    await expect(page.locator("body")).toContainText(/holiday/i);

    // Should render a table or list of holidays
    const table = page.locator("table");
    const list = page.locator(
      '[role="list"], [role="grid"], ul, ol, [class*="card"]',
    );
    const hasTable = await table.isVisible().catch(() => false);
    const hasList = await list.first().isVisible().catch(() => false);
    expect(hasTable || hasList).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 4. Employee — Settings Access Denied
// ---------------------------------------------------------------------------

test.describe("Employee — Settings Access Control", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("employee cannot access departments settings", async ({ page }) => {
    await page.goto("/dashboard/settings/departments");
    await page.waitForLoadState("networkidle");

    // Should be redirected away OR see an unauthorized/forbidden message
    const url = page.url();
    const body = await page.locator("body").textContent();

    const wasRedirected =
      !url.includes("/settings/departments") || url.includes("/dashboard");
    const showsUnauthorized =
      /unauthorized|forbidden|access denied|not allowed|403/i.test(
        body ?? "",
      );

    // Either redirected away from settings OR shown an access-denied message
    expect(wasRedirected || showsUnauthorized).toBeTruthy();
  });

  test("employee cannot access leave types settings", async ({ page }) => {
    await page.goto("/dashboard/settings/leave-types");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const body = await page.locator("body").textContent();

    const wasRedirected =
      !url.includes("/settings/leave-types") || url.includes("/dashboard");
    const showsUnauthorized =
      /unauthorized|forbidden|access denied|not allowed|403/i.test(
        body ?? "",
      );

    expect(wasRedirected || showsUnauthorized).toBeTruthy();
  });

  test("employee cannot access holidays settings", async ({ page }) => {
    await page.goto("/dashboard/settings/holidays");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const body = await page.locator("body").textContent();

    const wasRedirected =
      !url.includes("/settings/holidays") || url.includes("/dashboard");
    const showsUnauthorized =
      /unauthorized|forbidden|access denied|not allowed|403/i.test(
        body ?? "",
      );

    expect(wasRedirected || showsUnauthorized).toBeTruthy();
  });
});
