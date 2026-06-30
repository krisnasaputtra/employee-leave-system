import { type Page } from "@playwright/test";

/**
 * Login helper — fills the login form and submits.
 * Waits for redirect to dashboard.
 */
export async function login(page: Page, email: string, password: string) {
  // Clear auth cookies so login page always shows the form
  await page.context().clearCookies();

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Use CSS selectors (resilient to i18n label changes)
  await page.locator('input[type="email"]').waitFor({ timeout: 30000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for navigation to dashboard (longer timeout for cold start)
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

/**
 * Admin login with default credentials.
 * Adjust these if the test database uses different credentials.
 */
export async function loginAsAdmin(page: Page) {
  await login(page, "admin@company.com", "Admin123!");
}

export async function loginAsManager(page: Page) {
  await login(page, "manager@test.com", "Test12345!");
}

export async function loginAsEmployee(page: Page) {
  await login(page, "employee@test.com", "Test12345!");
}
