import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Employee Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("employee list loads with data", async ({ page }) => {
    await page.goto("/dashboard/employees");
    await expect(
      page.getByRole("heading", { name: /employees/i }),
    ).toBeVisible();
    // Should have a table with employee data
    await expect(page.locator("table")).toBeVisible();
  });

  test("search filters employees without page refresh", async ({ page }) => {
    await page.goto("/dashboard/employees");
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    // Type in search — should not trigger page navigation
    const currentUrl = page.url();
    await searchInput.fill("test");
    // Wait for debounce (300ms) + fetch
    await page.waitForTimeout(500);
    // URL should NOT change (client-side search)
    expect(page.url()).toBe(currentUrl);
  });

  test("can navigate to add employee page", async ({ page }) => {
    await page.goto("/dashboard/employees");
    await page.getByRole("link", { name: /add employee/i }).click();
    await expect(page).toHaveURL(/\/employees\/new/);
    await expect(
      page.getByRole("heading", { name: /new employee|add employee/i }),
    ).toBeVisible();
  });
});
