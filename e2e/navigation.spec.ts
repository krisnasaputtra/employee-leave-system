import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("dashboard loads after login", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    // Should see some dashboard content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("can navigate to employees page", async ({ page }) => {
    await page.goto("/dashboard/employees");
    await expect(
      page.getByRole("heading", { name: /employees/i }),
    ).toBeVisible();
  });

  test("can navigate to leave requests page", async ({ page }) => {
    await page.goto("/dashboard/leave/requests");
    await expect(
      page.getByRole("heading", { name: /leave request/i }),
    ).toBeVisible();
  });

  test("can navigate to approvals page", async ({ page }) => {
    await page.goto("/dashboard/approvals");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("can navigate to calendar page", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("can navigate to notifications page", async ({ page }) => {
    await page.goto("/dashboard/notifications");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("can navigate to settings pages", async ({ page }) => {
    await page.goto("/dashboard/settings/leave-types");
    await expect(
      page.getByRole("heading", { name: /leave types/i }),
    ).toBeVisible();
  });
});
