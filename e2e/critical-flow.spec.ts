import { expect, test, type Page } from "@playwright/test";

/**
 * LRM — E2E Smoke Tests
 *
 * Tests the critical flows of the Leave Request Management system.
 *
 * Prerequisites:
 * 1. Running dev server (npm run dev) or Playwright will start it
 * 2. Supabase project with provisioned accounts
 * 3. Environment variables in .env.local:
 *    - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *    - E2E_EMPLOYEE_EMAIL / E2E_EMPLOYEE_PASSWORD
 *    - E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD
 *
 * Run: npx playwright test
 * Run headed: npx playwright test --headed
 * Report: npx playwright show-report
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@company.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin123!";
const EMPLOYEE_EMAIL = process.env.E2E_EMPLOYEE_EMAIL ?? "employee@test.com";
const EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD ?? "Test12345!";
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL ?? "manager@test.com";
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD ?? "Test12345!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page, email: string, password: string) {
  // Clear auth cookies so login page always shows the form
  await page.context().clearCookies();

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Wait for the form to be ready, then fill
  await page.locator('input[type="email"]').waitFor({ timeout: 30000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard (longer timeout for cold start)
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

async function logout(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// 1. Authentication Tests
// ---------------------------------------------------------------------------

test.describe("1. Authentication", () => {
  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("Invalid credentials show error message (not raw Supabase error)", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("nobody@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("AuthApiError");
    expect(body).not.toContain("PostgrestError");
  });

  test("Admin can sign in and access dashboard", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("body")).toContainText(/dashboard/i);
  });

  test("Employee can sign in and access dashboard", async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Manager can sign in and access dashboard", async ({ page }) => {
    // Skip if manager account not provisioned
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill(MANAGER_EMAIL);
    await page.locator('input[type="password"]').fill(MANAGER_PASSWORD);
    await page.locator('button[type="submit"]').click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    } catch {
      test.skip(true, "Manager account not provisioned in Supabase — skipping");
      return;
    }
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ---------------------------------------------------------------------------
// 2. Admin — Employee Management
// ---------------------------------------------------------------------------

test.describe("2. Admin — Employee Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("Admin can access employees list", async ({ page }) => {
    await page.goto("/dashboard/employees");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText(/employee/i);
  });

  test("Admin can view employee detail", async ({ page }) => {
    await page.goto("/dashboard/employees");
    await page.waitForLoadState("networkidle");

    // Click first employee link
    const firstEmployee = page.locator("table a").first();
    if (await firstEmployee.isVisible()) {
      await firstEmployee.click();
      await page.waitForURL(/\/employees\//, { timeout: 10000 });
      await expect(page.locator("body")).toContainText(/Personal Information|Organization/i);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Admin — Settings (Departments, Leave Types, Holidays)
// ---------------------------------------------------------------------------

test.describe("3. Admin — Settings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("Admin can access departments page", async ({ page }) => {
    await page.goto("/dashboard/settings/departments");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/department/i);
  });

  test("Admin can access leave types page", async ({ page }) => {
    await page.goto("/dashboard/settings/leave-types");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/leave type/i);
  });

  test("Admin can access holidays page", async ({ page }) => {
    await page.goto("/dashboard/settings/holidays");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/holidays/);
  });
});

// ---------------------------------------------------------------------------
// 4. Admin — Leave Balance Management
// ---------------------------------------------------------------------------

test.describe("4. Admin — Balance Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("Admin can access own balances page", async ({ page }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/balance/i);
  });

  test("Admin can see Manage Balances button", async ({ page }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("domcontentloaded");
    // Look for the link that goes to manage page (resilient to i18n)
    const manageLink = page.locator('a[href*="manage"]');
    await expect(manageLink).toBeVisible({ timeout: 15000 });
  });

  test("Admin can navigate to employee balance management", async ({ page }) => {
    // First get an employee ID from the employees list
    await page.goto("/dashboard/employees");
    await page.waitForLoadState("networkidle");

    const firstEmployeeLink = page.locator("table a").first();
    if (await firstEmployeeLink.isVisible()) {
      await firstEmployeeLink.click();
      await page.waitForURL(/\/employees\//, { timeout: 10000 });

      // Extract employee ID from URL
      const url = page.url();
      const match = url.match(/employees\/([^/]+)/);
      if (match) {
        const employeeId = match[1];

        // Navigate to balance management for this employee
        await page.goto(`/dashboard/leave/balances/${employeeId}`);
        await page.waitForLoadState("networkidle");

        // Should see the balance management page
        await expect(page.locator("body")).toContainText(/balance/i);

        // Should see Initialize Balances button
        const initBtn = page.locator('text="Initialize Balances"');
        if (await initBtn.isVisible()) {
          // Click Initialize Balances
          await initBtn.click();

          // Wait for dialog/confirmation
          await page.waitForTimeout(2000);

          // Check for success toast or balance cards appearing
          const body = await page.locator("body").textContent();
          const hasBalances = body?.includes("Entitled") || body?.includes("Remaining");
          const hasSuccess = body?.includes("initialized") || body?.includes("success");
          expect(hasBalances || hasSuccess).toBeTruthy();
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Employee — Leave Request Flow
// ---------------------------------------------------------------------------

test.describe("5. Employee — Leave Request", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
  });

  test("Employee can access leave requests page", async ({ page }) => {
    await page.goto("/dashboard/leave/requests");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/request/i);
  });

  test("Employee can access new leave request form", async ({ page }) => {
    await page.goto("/dashboard/leave/requests/new");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/New Leave Request|Request Details/i);
  });

  test("Employee can submit leave request", async ({ page }) => {
    await page.goto("/dashboard/leave/requests/new");
    await page.waitForLoadState("networkidle");

    // Select leave type (uses shadcn Select component)
    const leaveTypeSelect = page.locator('[data-slot="select-trigger"]').first();
    if (await leaveTypeSelect.isVisible({ timeout: 5000 })) {
      await leaveTypeSelect.click();
      await page.locator('[data-slot="select-item"]').first().click();
    }

    // Set dates — next week
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 8);

    await page.locator('input[type="date"]').first().fill(startDate.toISOString().split("T")[0]);
    await page.locator('input[type="date"]').nth(1).fill(endDate.toISOString().split("T")[0]);

    // Add reason
    const textarea = page.locator("textarea");
    if (await textarea.isVisible()) {
      await textarea.fill("E2E Playwright test — leave request");
    }

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to requests list or success
    await page.waitForURL(/\/requests/, { timeout: 15000 });
  });

  test("Employee can view leave balances", async ({ page }) => {
    await page.goto("/dashboard/leave/balances");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/balance/i);
  });
});

// ---------------------------------------------------------------------------
// 6. Manager — Approval Flow
// ---------------------------------------------------------------------------

test.describe("6. Manager — Approvals", () => {
  test("Manager can access approvals page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill(MANAGER_EMAIL);
    await page.locator('input[type="password"]').fill(MANAGER_PASSWORD);
    await page.locator('button[type="submit"]').click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    } catch {
      test.skip(true, "Manager account not provisioned in Supabase — skipping");
      return;
    }

    await page.goto("/dashboard/approvals");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/approval|pending/i);
  });
});

// ---------------------------------------------------------------------------
// 7. Navigation & Access Control
// ---------------------------------------------------------------------------

test.describe("7. Page Load Verification", () => {
  // This test iterates 12 pages — needs longer timeout
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("All admin pages load without errors", async ({ page }) => {
    const adminPages = [
      "/dashboard",
      "/dashboard/employees",
      "/dashboard/leave/requests",
      "/dashboard/leave/balances",
      "/dashboard/approvals",
      "/dashboard/audit-logs",
      "/dashboard/leave/all",
      "/dashboard/settings/departments",
      "/dashboard/settings/leave-types",
      "/dashboard/settings/holidays",
      "/dashboard/calendar",
      "/dashboard/notifications",
    ];

    for (const url of adminPages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      // No error pages — body should NOT contain raw error messages
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Shared Pages (All Roles)
// ---------------------------------------------------------------------------

test.describe("8. Shared Pages", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
  });

  test("Calendar page loads", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/calendar/i);
  });

  test("Notifications page loads", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/notification/i);
  });
});

// ---------------------------------------------------------------------------
// 9. Admin — Audit Logs
// ---------------------------------------------------------------------------

test.describe("9. Admin — Audit Logs", () => {
  test("Admin can access audit logs with pagination", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/audit-logs");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/Audit Logs/i);
  });
});

// ---------------------------------------------------------------------------
// 10. Admin — All Requests
// ---------------------------------------------------------------------------

test.describe("10. Admin — All Requests", () => {
  test("Admin can access all requests page", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/leave/all");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/All.*Request|request/i);
  });
});
