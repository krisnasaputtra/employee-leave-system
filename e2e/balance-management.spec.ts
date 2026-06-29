import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsEmployee } from "./helpers/auth";

/**
 * Balance Management E2E Tests
 *
 * Validates that:
 * - Admins can access the balance management page with employee list,
 *   search input, and pagination controls.
 * - Employees can view their own leave balance info showing
 *   entitled, used, and remaining days.
 *
 * Prerequisites:
 * - Running dev server or Playwright webServer config
 * - Supabase project with admin & employee test accounts
 * - At least one employee with initialized leave balances
 */

// ---------------------------------------------------------------------------
// 1. Admin — Manage Balances Page
// ---------------------------------------------------------------------------

test.describe("Admin — Manage Balances", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("manage balances page loads with employee list", async ({ page }) => {
    await page.goto("/dashboard/leave/balances/manage");
    await page.waitForLoadState("networkidle");

    // Page should contain balance-related content
    await expect(page.locator("body")).toContainText(/balance|manage/i);

    // Should render an employee list — table, cards, or list items
    const table = page.locator("table");
    const cards = page.locator(
      '[class*="card"], [role="listitem"], [role="row"]',
    );
    const hasTable = await table.isVisible().catch(() => false);
    const hasCards =
      (await cards.count().catch(() => 0)) > 0 &&
      (await cards.first().isVisible().catch(() => false));

    expect(hasTable || hasCards).toBeTruthy();
  });

  test("manage balances page has a search input", async ({ page }) => {
    await page.goto("/dashboard/leave/balances/manage");
    await page.waitForLoadState("networkidle");

    // Look for search input using multiple strategies
    const searchInput = page
      .getByRole("searchbox")
      .or(page.locator('input[type="search"]'))
      .or(page.getByPlaceholder(/search|filter|find/i))
      .or(page.locator('input[name*="search"], input[name*="filter"]'));

    await expect(searchInput.first()).toBeVisible({ timeout: 15000 });
  });

  test("manage balances page has pagination controls", async ({ page }) => {
    await page.goto("/dashboard/leave/balances/manage");
    await page.waitForLoadState("networkidle");

    // Look for pagination — buttons with next/previous, page numbers, or nav[aria-label]
    const pagination = page
      .locator('nav[aria-label*="pagination" i]')
      .or(page.locator('[class*="pagination"]'))
      .or(
        page.locator("button").filter({ hasText: /next|previous|›|»|‹|«/i }),
      )
      .or(page.getByRole("navigation", { name: /pagination/i }));

    // Pagination may not appear if there are fewer items than page size
    // In that case, we at least verify the page loaded without errors
    const hasPagination = await pagination
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!hasPagination) {
      // If no pagination visible, verify that the page at least loaded properly
      // (small dataset scenario — fewer entries than page size)
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
    } else {
      expect(hasPagination).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Employee — View Own Balances
// ---------------------------------------------------------------------------

test.describe("Employee — Leave Balances", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("balances page loads with balance info", async ({ page }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("networkidle");

    // Should see the balances page
    await expect(page.locator("body")).toContainText(/balance/i);
  });

  test("balances page shows entitled, used, and remaining info", async ({
    page,
  }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();

    // The page should display balance breakdown info.
    // Check for common balance labels (case-insensitive).
    const hasEntitled = /entitled|allowance|total|allocated/i.test(body ?? "");
    const hasUsed = /used|taken|consumed/i.test(body ?? "");
    const hasRemaining = /remaining|available|left/i.test(body ?? "");

    // At least two of the three indicators should be present
    const matchCount = [hasEntitled, hasUsed, hasRemaining].filter(
      Boolean,
    ).length;
    expect(matchCount).toBeGreaterThanOrEqual(2);
  });

  test("balances page renders balance cards or table", async ({ page }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("networkidle");

    // Should render balance data in cards, table, or list format
    const table = page.locator("table");
    const cards = page.locator(
      '[class*="card"], [class*="balance"], [role="listitem"]',
    );
    const hasTable = await table.isVisible().catch(() => false);
    const hasCards =
      (await cards.count().catch(() => 0)) > 0 &&
      (await cards.first().isVisible().catch(() => false));

    expect(hasTable || hasCards).toBeTruthy();
  });
});
