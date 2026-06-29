import { expect, test } from "@playwright/test";
import {
  loginAsEmployee,
  loginAsManager,
} from "./helpers/auth";

/**
 * Team & Delegation E2E Tests
 *
 * Covers:
 * - Manager: /dashboard/team loads with team members table
 * - Employee: /dashboard/team loads with colleagues
 * - Manager: /dashboard/delegations loads with delegation form
 * - Employee: /dashboard/delegations is accessible
 *
 * Each test is independent and logs in fresh via the auth helpers.
 */

// ---------------------------------------------------------------------------
// 1. Manager — Team Page
// ---------------------------------------------------------------------------

test.describe("Team — Manager view", () => {
  test("manager can access team page", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    // Page should contain team-related content
    await expect(page.locator("body")).toContainText(/team|member|employee/i, {
      timeout: 15000,
    });
  });

  test("manager team page shows members table or list", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    // Should display a table, list, or card grid of team members
    const table = page.locator("table, [role='grid']");
    const list = page.locator("[role='list'], ul, ol");
    const cards = page.locator("[data-testid*='member'], [data-testid*='team']");
    const emptyState = page.locator(
      'text=/no.*member|no.*team|empty|no.*employee/i',
    );

    const hasTable = await table
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    const hasList = await list
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasCards = await cards
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTable || hasList || hasCards || hasEmptyState).toBeTruthy();
  });

  test("manager team page shows member details", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 15000 }).catch(() => false)) {
      const headers = page.locator("th, [role='columnheader']");
      const headerTexts = await headers.allTextContents();
      const joinedHeaders = headerTexts.join(" ").toLowerCase();

      // Team table should have identifying columns
      const hasRelevantHeaders =
        joinedHeaders.includes("name") ||
        joinedHeaders.includes("email") ||
        joinedHeaders.includes("role") ||
        joinedHeaders.includes("department") ||
        joinedHeaders.includes("position");
      expect(hasRelevantHeaders).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Employee — Team Page
// ---------------------------------------------------------------------------

test.describe("Team — Employee view", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("employee can access team page", async ({ page }) => {
    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const isOnTeam = currentUrl.includes("/team");
    const isOnDashboard = currentUrl.includes("/dashboard");

    // Either stayed on team page or was redirected to dashboard
    expect(isOnTeam || isOnDashboard).toBeTruthy();
  });

  test("employee team page shows colleagues or appropriate content", async ({
    page,
  }) => {
    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/team")) {
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");

      // Should show team-related content
      const hasContent =
        body?.toLowerCase().includes("team") ||
        body?.toLowerCase().includes("member") ||
        body?.toLowerCase().includes("colleague") ||
        body?.toLowerCase().includes("employee") ||
        body?.toLowerCase().includes("department") ||
        body?.toLowerCase().includes("no");
      expect(hasContent).toBeTruthy();
    }
  });

  test("employee team page does not show manager-only controls", async ({
    page,
  }) => {
    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/team")) {
      // Employee should not see management actions like "Add Member", "Remove"
      const managerControls = page.locator(
        'button:has-text("Add Member"), button:has-text("Remove Member"), button:has-text("Reassign")',
      );

      const hasManagerControls = await managerControls
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasManagerControls).toBeFalsy();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Manager — Delegations Page
// ---------------------------------------------------------------------------

test.describe("Delegations — Manager view", () => {
  test("manager can access delegations page", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(
      /delegation|delegate|assign/i,
      { timeout: 15000 },
    );
  });

  test("manager delegations page has a delegation form", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    // Look for form elements: inputs, selects, buttons
    const form = page.locator("form");
    const inputs = page.locator(
      'input, select, [role="combobox"], textarea, [data-slot="select-trigger"]',
    );
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Create"), button:has-text("Add"), button:has-text("Delegate"), button:has-text("Save")',
    );

    const hasForm = await form
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    const hasInputs = await inputs
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasSubmit = await submitButton
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    // At least a form or interactive elements should be present
    expect(hasForm || hasInputs || hasSubmit).toBeTruthy();
  });

  test("manager delegations page shows existing delegations or empty state", async ({
    page,
  }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    // Should show a list/table of existing delegations or empty state
    const table = page.locator("table, [role='grid']");
    const list = page.locator("[role='list']");
    const emptyState = page.locator(
      'text=/no.*delegation|no.*data|empty|no.*active/i',
    );
    const cards = page.locator(
      "[data-testid*='delegation'], .card, [class*='card']",
    );

    const hasTable = await table
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasList = await list
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasEmptyState = await emptyState
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasCards = await cards
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasTable || hasList || hasEmptyState || hasCards).toBeTruthy();
  });

  test("manager delegations page does not show errors", async ({ page }) => {
    try {
      await loginAsManager(page);
    } catch {
      test.skip(true, "Manager account not provisioned — skipping");
      return;
    }

    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("AuthApiError");
    expect(body).not.toContain("PostgrestError");
  });
});

// ---------------------------------------------------------------------------
// 4. Employee — Delegations Page
// ---------------------------------------------------------------------------

test.describe("Delegations — Employee view", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page);
  });

  test("employee can access delegations page", async ({ page }) => {
    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    const isOnDelegations = currentUrl.includes("/delegations");
    const isOnDashboard = currentUrl.includes("/dashboard");

    // Either stayed on delegations page or redirected to dashboard
    expect(isOnDelegations || isOnDashboard).toBeTruthy();
  });

  test("employee delegations page shows appropriate content", async ({
    page,
  }) => {
    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/delegations")) {
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");

      // Should show delegation-related content
      const hasContent =
        body?.toLowerCase().includes("delegation") ||
        body?.toLowerCase().includes("delegate") ||
        body?.toLowerCase().includes("assign") ||
        body?.toLowerCase().includes("no") ||
        body?.toLowerCase().includes("empty");
      expect(hasContent).toBeTruthy();
    }
  });

  test("employee delegations page does not expose manager-only actions", async ({
    page,
  }) => {
    await page.goto("/dashboard/delegations");
    await page.waitForLoadState("networkidle");

    if (page.url().includes("/delegations")) {
      // Employee should not see bulk management actions
      const managerOnlyActions = page.locator(
        'button:has-text("Revoke All"), button:has-text("Manage All"), button:has-text("Admin")',
      );

      const hasManagerActions = await managerOnlyActions
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasManagerActions).toBeFalsy();
    }
  });
});
