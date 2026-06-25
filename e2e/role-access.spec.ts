import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsEmployee } from "./helpers/auth";

test.describe("Role-based Access Control", () => {
  test("admin can access employees page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/employees");
    await expect(
      page.getByRole("heading", { name: /employees/i }),
    ).toBeVisible();
  });

  test("admin can access settings", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/settings/leave-types");
    await expect(
      page.getByRole("heading", { name: /leave types/i }),
    ).toBeVisible();
  });

  test("admin can access all requests", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/leave/all");
    await expect(
      page.getByRole("heading", { name: /all leave requests/i }),
    ).toBeVisible();
  });
});
