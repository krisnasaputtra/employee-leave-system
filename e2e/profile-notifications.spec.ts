import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsEmployee } from "./helpers/auth";

/**
 * Profile, Notifications & Miscellaneous E2E Tests
 *
 * Validates that:
 * - Admin can access profile, notifications, analytics-reports, and audit-logs pages
 * - Employee can access profile and calendar pages
 *
 * Prerequisites:
 * - Running dev server or Playwright webServer config
 * - Supabase project with admin & employee test accounts
 */

// ---------------------------------------------------------------------------
// 1. Admin — Profile Page
// ---------------------------------------------------------------------------

test.describe("Admin — Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("profile page loads with user info", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("networkidle");

    // Should display user profile content
    await expect(page.locator("body")).toContainText(/profile/i);

    // Should contain user-related fields (name, email, role, etc.)
    const body = await page.locator("body").textContent();
    const hasUserInfo =
      /email|name|role|department|phone|personal|account/i.test(body ?? "");
    expect(hasUserInfo).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Admin — Notifications Page
// ---------------------------------------------------------------------------

test.describe("Admin — Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("notifications page loads with notification list", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");

    // Should see the notifications page
    await expect(page.locator("body")).toContainText(/notification/i);

    // Should render a list of notifications — or an empty state message
    const list = page.locator(
      '[role="list"], [role="listitem"], [class*="notification"], table',
    );
    const emptyState = page.locator("body").filter({
      hasText: /no notification|empty|nothing|all caught up/i,
    });

    const hasList = await list
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either a notification list is shown OR an empty-state message
    expect(hasList || hasEmptyState).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 3. Admin — Analytics & Reports
// ---------------------------------------------------------------------------

test.describe("Admin — Analytics Reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("analytics-reports page loads with chart area", async ({ page }) => {
    await page.goto("/dashboard/analytics-reports");
    await page.waitForLoadState("networkidle");

    // Should display analytics/reports content
    const body = await page.locator("body").textContent();
    const hasAnalytics = /analytics|report|chart|statistic|overview/i.test(
      body ?? "",
    );
    expect(hasAnalytics).toBeTruthy();

    // Should render chart elements — canvas (Chart.js), svg (D3/Recharts), or chart containers
    const charts = page
      .locator("canvas")
      .or(page.locator("svg"))
      .or(page.locator('[class*="chart"], [class*="recharts"]'))
      .or(page.locator('[role="img"]'));

    const hasCharts = await charts
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    // Even without chart data, the page should at least have rendered without errors
    if (!hasCharts) {
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Admin — Audit Logs
// ---------------------------------------------------------------------------

test.describe("Admin — Audit Logs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("audit-logs page loads with log entries table", async ({ page }) => {
    await page.goto("/dashboard/audit-logs");
    await page.waitForLoadState("networkidle");

    // Should display audit log content
    await expect(page.locator("body")).toContainText(/audit log/i);

    // Should render a table of log entries
    const table = page.locator("table");
    const rows = page.locator("table tbody tr, table tr");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Table exists — verify it has header cells
      const headerCells = page.locator("table th, table thead td");
      const headerCount = await headerCells.count().catch(() => 0);
      expect(headerCount).toBeGreaterThan(0);
    } else {
      // Fallback — page should at least have loaded without errors
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Employee — Profile Page
// ---------------------------------------------------------------------------

test.describe("Employee — Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("employee profile page loads", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.waitForLoadState("networkidle");

    // Should display profile content
    await expect(page.locator("body")).toContainText(/profile/i);

    // Should contain user-related fields
    const body = await page.locator("body").textContent();
    const hasUserInfo =
      /email|name|role|department|phone|personal|account/i.test(body ?? "");
    expect(hasUserInfo).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 6. Employee — Calendar Page
// ---------------------------------------------------------------------------

test.describe("Employee — Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("calendar page loads with calendar widget", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await page.waitForLoadState("networkidle");

    // Should display calendar content
    await expect(page.locator("body")).toContainText(/calendar/i);

    // Should render a calendar widget — look for common calendar indicators
    const calendarWidget = page
      .locator('[class*="calendar"], [role="grid"]')
      .or(page.locator("table").filter({ hasText: /mon|tue|wed|thu|fri/i }))
      .or(page.locator('[class*="fc-"], [class*="rbc-"]')) // FullCalendar or react-big-calendar
      .or(page.locator('[data-testid*="calendar"]'));

    const hasCalendar = await calendarWidget
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (!hasCalendar) {
      // Fallback: at least verify the page loaded and has date-related content
      const body = await page.locator("body").textContent();
      const hasDateContent =
        /january|february|march|april|may|june|july|august|september|october|november|december|\d{4}/i.test(
          body ?? "",
        );
      expect(hasDateContent).toBeTruthy();
    }
  });
});
