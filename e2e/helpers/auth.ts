import { type Page } from "@playwright/test";

/**
 * Login helper — fills the login form and submits.
 * Waits for redirect to dashboard.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

/**
 * Admin login with default credentials.
 * Adjust these if the test database uses different credentials.
 */
export async function loginAsAdmin(page: Page) {
  await login(page, "admin@company.com", "admin123");
}

export async function loginAsManager(page: Page) {
  await login(page, "manager@company.com", "manager123");
}

export async function loginAsEmployee(page: Page) {
  await login(page, "employee@company.com", "employee123");
}
