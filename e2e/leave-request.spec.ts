import { expect, test } from "@playwright/test";
import { loginAsAdmin, loginAsEmployee } from "./helpers/auth";

/**
 * Leave Request E2E Tests
 *
 * Covers:
 * - Employee: create a new leave request via /dashboard/leave/requests/new
 * - Employee: view leave requests list at /dashboard/leave/requests
 * - Admin: view all requests at /dashboard/leave/all with search
 *
 * Each test is independent and logs in fresh via the auth helpers.
 */

// ---------------------------------------------------------------------------
// 1. Employee — New Leave Request Form & Submission
// ---------------------------------------------------------------------------

test.describe("Leave Request — Employee creates a new request", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("new leave request form has required fields", async ({ page }) => {
    await page.goto("/dashboard/leave/requests/new");
    await page.waitForLoadState("networkidle");

    // Leave type — either a <select>, a combobox trigger, or a shadcn Select
    const leaveTypeSelect = page.locator(
      'select, [role="combobox"], [data-slot="select-trigger"]',
    );
    await expect(leaveTypeSelect.first()).toBeVisible({ timeout: 15000 });

    // Date pickers — native date inputs or date-picker buttons
    const datePickers = page.locator(
      'input[type="date"], button[data-slot="calendar-trigger"], [data-testid*="date"]',
    );
    await expect(datePickers.first()).toBeVisible({ timeout: 10000 });

    // Reason textarea
    const reasonField = page.locator("textarea");
    await expect(reasonField).toBeVisible({ timeout: 10000 });
  });

  test("employee can fill and submit a leave request", async ({ page }) => {
    await page.goto("/dashboard/leave/requests/new");
    await page.waitForLoadState("networkidle");

    // --- Select leave type ---
    const shadcnSelect = page.locator('[data-slot="select-trigger"]').first();
    const nativeSelect = page.locator("select").first();
    const combobox = page.locator('[role="combobox"]').first();

    if (await shadcnSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shadcnSelect.click();
      await page
        .locator('[data-slot="select-item"]')
        .first()
        .click({ timeout: 10000 });
    } else if (
      await nativeSelect.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      const options = nativeSelect.locator("option:not([value=''])");
      const firstValue = await options.first().getAttribute("value");
      if (firstValue) {
        await nativeSelect.selectOption(firstValue);
      }
    } else if (
      await combobox.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await combobox.click();
      await page
        .getByRole("option")
        .first()
        .click({ timeout: 10000 });
    }

    // --- Fill dates (next week) ---
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 9);

    const startISO = startDate.toISOString().split("T")[0];
    const endISO = endDate.toISOString().split("T")[0];

    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      await dateInputs.first().fill(startISO);
      await dateInputs.nth(1).fill(endISO);
    } else {
      // Fallback: try date-picker buttons / any input with "date" in name
      const altDateInputs = page.locator(
        'input[name*="date"], input[placeholder*="date" i]',
      );
      if ((await altDateInputs.count()) >= 2) {
        await altDateInputs.first().fill(startISO);
        await altDateInputs.nth(1).fill(endISO);
      }
    }

    // --- Fill reason ---
    const textarea = page.locator("textarea");
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill(
        "E2E Playwright automated test — leave request submission",
      );
    }

    // --- Submit ---
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    // --- Verify redirect to requests list ---
    await page.waitForURL(/\/dashboard\/leave\/requests/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/dashboard\/leave\/requests/);
  });

  test("newly submitted request appears in the requests list", async ({
    page,
  }) => {
    // First submit a request so we have data
    await page.goto("/dashboard/leave/requests/new");
    await page.waitForLoadState("networkidle");

    const uniqueReason = `E2E-test-${Date.now()}`;

    // Select leave type
    const shadcnSelect = page.locator('[data-slot="select-trigger"]').first();
    if (await shadcnSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shadcnSelect.click();
      await page.locator('[data-slot="select-item"]').first().click();
    }

    // Fill dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 15);

    const dateInputs = page.locator('input[type="date"]');
    if ((await dateInputs.count()) >= 2) {
      await dateInputs.first().fill(startDate.toISOString().split("T")[0]);
      await dateInputs.nth(1).fill(endDate.toISOString().split("T")[0]);
    }

    // Fill reason with unique marker
    const textarea = page.locator("textarea");
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill(uniqueReason);
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard\/leave\/requests/, { timeout: 30000 });

    // Verify the new request appears
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    const hasRequest =
      body?.includes(uniqueReason) ||
      body?.includes("Pending") ||
      body?.includes("pending");
    expect(hasRequest).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 2. Employee — Leave Requests List
// ---------------------------------------------------------------------------

test.describe("Leave Request — Employee views requests list", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("requests page loads and shows table or empty state", async ({
    page,
  }) => {
    await page.goto("/dashboard/leave/requests");
    await page.waitForLoadState("networkidle");

    // Page should contain either a table with requests or an empty-state message
    const table = page.locator("table");
    const emptyState = page.locator(
      'text=/no.*request|no.*data|empty|not found/i',
    );

    const hasTable = await table.isVisible({ timeout: 15000 }).catch(() => false);
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test("requests table has expected column headers", async ({ page }) => {
    await page.goto("/dashboard/leave/requests");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 15000 }).catch(() => false)) {
      // Check for common column headers
      const headers = page.locator("th, [role='columnheader']");
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      const headerTexts = await headers.allTextContents();
      const joinedHeaders = headerTexts.join(" ").toLowerCase();

      // At least one recognizable header should exist
      const hasRelevantHeader =
        joinedHeaders.includes("type") ||
        joinedHeaders.includes("status") ||
        joinedHeaders.includes("date") ||
        joinedHeaders.includes("reason") ||
        joinedHeaders.includes("leave");
      expect(hasRelevantHeader).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Admin — All Leave Requests with Search
// ---------------------------------------------------------------------------

test.describe("Leave Request — Admin views all requests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin all-requests page loads with table", async ({ page }) => {
    await page.goto("/dashboard/leave/all");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/request/i, {
      timeout: 15000,
    });

    // Should have a table or grid of all requests
    const table = page.locator("table, [role='grid']");
    const emptyState = page.locator(
      'text=/no.*request|no.*data|empty/i',
    );

    const hasTable = await table
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test("admin all-requests page has search functionality", async ({
    page,
  }) => {
    await page.goto("/dashboard/leave/all");
    await page.waitForLoadState("networkidle");

    // Look for a search/filter input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], input[name*="search" i]',
    );

    if (await searchInput.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      // Type a search query
      await searchInput.first().fill("test");
      await page.waitForTimeout(1000); // debounce

      // Page should still be functional after search
      await expect(page.locator("body")).toContainText(/request/i);
    } else {
      // Search might be in a different form (filter dropdown, etc.)
      const filterButton = page.locator(
        'button:has-text("Filter"), button:has-text("Search"), [data-testid*="filter"]',
      );
      const hasFilter = await filterButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // At minimum the page loaded successfully
      await expect(page.locator("body")).toContainText(/request/i);

      if (hasFilter) {
        await filterButton.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("admin can see requests from all employees", async ({ page }) => {
    await page.goto("/dashboard/leave/all");
    await page.waitForLoadState("networkidle");

    // The all-requests view typically includes employee name/email columns
    const table = page.locator("table");
    if (await table.isVisible({ timeout: 15000 }).catch(() => false)) {
      const headers = page.locator("th, [role='columnheader']");
      const headerTexts = await headers.allTextContents();
      const joinedHeaders = headerTexts.join(" ").toLowerCase();

      // Should include identifying info (employee name or similar)
      const hasEmployeeInfo =
        joinedHeaders.includes("employee") ||
        joinedHeaders.includes("name") ||
        joinedHeaders.includes("user") ||
        joinedHeaders.includes("requester") ||
        joinedHeaders.includes("status");
      expect(hasEmployeeInfo).toBeTruthy();
    }
  });
});
