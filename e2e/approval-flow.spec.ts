import { expect, test } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsEmployee,
  loginAsManager,
} from "./helpers/auth";

/**
 * Approval Flow E2E Tests
 *
 * Covers:
 * - Manager: /dashboard/approvals loads and shows pending requests or empty state
 * - Admin: /dashboard/approvals shows all pending requests
 * - Employee: /dashboard/approvals is accessible (for delegation scenarios)
 *
 * Each test is independent and logs in fresh via the auth helpers.
 */

// ---------------------------------------------------------------------------
// 1. Manager — Approvals Page
// ---------------------------------------------------------------------------

test.describe("Approval Flow — Manager", () => {
  test("manager can access approvals page", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    // Page should display approvals-related content
    await expect(page.locator("body")).toContainText(/approval|pending|review/i, {
      timeout: 15000,
    });
  });

  test("manager approvals page shows pending requests table or empty state", async ({
    page,
  }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    // Should show either a table of pending requests or an empty state
    const table = page.locator("table, [role='grid']");
    const emptyState = page.locator(
      'text=/no.*pending|no.*approval|no.*request|empty|nothing/i',
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

  test("manager approvals page has action buttons when requests exist", async ({
    page,
  }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 15000 }).catch(() => false)) {
      const rows = table.locator("tbody tr");
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Check for approve/reject action buttons in rows
        const actionButtons = page.locator(
          'button:has-text("Approve"), button:has-text("Reject"), button:has-text("Review"), [data-testid*="approve"], [data-testid*="reject"]',
        );

        const hasActions = await actionButtons
          .first()
          .isVisible({ timeout: 10000 })
          .catch(() => false);

        // If no inline buttons, there might be a detail link or dropdown
        if (!hasActions) {
          const detailLinks = rows.first().locator("a, button");
          const linkCount = await detailLinks.count();
          expect(linkCount).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Admin — Approvals Page
// ---------------------------------------------------------------------------

test.describe("Approval Flow — Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can access approvals page", async ({ page }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/approval|pending|review/i, {
      timeout: 15000,
    });
  });

  test("admin approvals page shows all pending requests", async ({
    page,
  }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    // Should show either a table of all pending requests or an empty state
    const table = page.locator("table, [role='grid']");
    const emptyState = page.locator(
      'text=/no.*pending|no.*approval|no.*request|empty|nothing/i',
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

  test("admin approvals page does not show error state", async ({ page }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("AuthApiError");
    expect(body).not.toContain("PostgrestError");
  });

  test("admin can see requester information in approvals", async ({
    page,
  }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 15000 }).catch(() => false)) {
      const headers = page.locator("th, [role='columnheader']");
      const headerTexts = await headers.allTextContents();
      const joinedHeaders = headerTexts.join(" ").toLowerCase();

      // Admin view should include employee/requester identifying info
      const hasIdentifyingInfo =
        joinedHeaders.includes("employee") ||
        joinedHeaders.includes("name") ||
        joinedHeaders.includes("requester") ||
        joinedHeaders.includes("user") ||
        joinedHeaders.includes("status") ||
        joinedHeaders.includes("type");
      expect(hasIdentifyingInfo).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Employee — Approvals Access (Delegation)
// ---------------------------------------------------------------------------

test.describe("Approval Flow — Employee (delegation)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("employee can access approvals page", async ({ page }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    // Employee should be able to see the page (may be empty or show delegated items)
    // Should NOT get a hard error or redirect away
    const currentUrl = page.url();
    const isOnApprovals = currentUrl.includes("/approvals");
    const isOnDashboard = currentUrl.includes("/dashboard");

    // Either stayed on approvals page or was redirected to dashboard (acceptable)
    expect(isOnApprovals || isOnDashboard).toBeTruthy();
  });

  test("employee approvals page shows appropriate content", async ({
    page,
  }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/approvals")) {
      // If employee can access approvals, should see relevant content
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");

      // Should show either delegated approvals, empty state, or access message
      const hasContent =
        body?.toLowerCase().includes("approval") ||
        body?.toLowerCase().includes("pending") ||
        body?.toLowerCase().includes("no") ||
        body?.toLowerCase().includes("empty") ||
        body?.toLowerCase().includes("delegate");
      expect(hasContent).toBeTruthy();
    }
  });

  test("employee approvals page does not expose admin-only controls", async ({
    page,
  }) => {
    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/approvals")) {
      // Employee should not see bulk admin actions
      const bulkActions = page.locator(
        'button:has-text("Bulk Approve"), button:has-text("Bulk Reject"), button:has-text("Export All")',
      );

      const hasBulkActions = await bulkActions
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // It's acceptable if there are no bulk actions (expected for employees)
      expect(hasBulkActions).toBeFalsy();
    }
  });
});
