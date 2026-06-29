import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsEmployee } from './helpers/auth';

test.describe('Smoke Tests', () => {
  // ── 1. App loads ──────────────────────────────────────────────────────
  test('app loads - login page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
    // The login page should contain some form or heading
    await expect(
      page.getByRole('heading').or(page.locator('form')).first(),
    ).toBeVisible({ timeout: 30000 });
  });

  // ── 2. Admin login ───────────────────────────────────────────────────
  test('admin login - dashboard loads', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ── 3. Manager login ─────────────────────────────────────────────────
  test('manager login - dashboard loads', async ({ page }) => {
    await loginAsManager(page);
    await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ── 4. Employee login ────────────────────────────────────────────────
  test('employee login - dashboard loads', async ({ page }) => {
    await loginAsEmployee(page);
    await expect(page).toHaveURL(/dashboard/, { timeout: 30000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ── 5. All pages load as admin ────────────────────────────────────────
  const adminPages: { name: string; path: string }[] = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Employees', path: '/dashboard/employees' },
    { name: 'Leave Requests', path: '/dashboard/leave/requests' },
    { name: 'Leave Balances', path: '/dashboard/leave/balances' },
    { name: 'Manage Balances', path: '/dashboard/leave/balances/manage' },
    { name: 'All Leaves', path: '/dashboard/leave/all' },
    { name: 'Approvals', path: '/dashboard/approvals' },
    { name: 'Delegations', path: '/dashboard/delegations' },
    { name: 'Team', path: '/dashboard/team' },
    { name: 'Calendar', path: '/dashboard/calendar' },
    { name: 'Analytics & Reports', path: '/dashboard/analytics-reports' },
    { name: 'Audit Logs', path: '/dashboard/audit-logs' },
    { name: 'Notifications', path: '/dashboard/notifications' },
    { name: 'Profile', path: '/dashboard/profile' },
    { name: 'Departments Settings', path: '/dashboard/settings/departments' },
    { name: 'Leave Types Settings', path: '/dashboard/settings/leave-types' },
    { name: 'Holidays Settings', path: '/dashboard/settings/holidays' },
  ];

  for (const { name, path } of adminPages) {
    test(`page loads as admin: ${name} (${path})`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(path);
      // Verify no crash – page has meaningful content
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(
        page.locator('main, [role="main"], h1, h2, h3, .content, #content').first(),
      ).toBeVisible({ timeout: 30000 });
      // Ensure no unexpected error page
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('500');
    });
  }

  // ── 6. Sidebar renders with nav items ─────────────────────────────────
  test('sidebar renders with nav items', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    // Sidebar should be present with navigation links
    const sidebar = page.locator(
      'nav, aside, [role="navigation"], .sidebar, #sidebar',
    ).first();
    await expect(sidebar).toBeVisible({ timeout: 30000 });
    // Should contain multiple navigation items
    const navItems = sidebar.locator('a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(1);
  });

  // ── 7. Logout works ──────────────────────────────────────────────────
  test('logout works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await expect(page.locator('body')).not.toBeEmpty();
    // Find and click the logout button/link
    const logoutTrigger = page.getByRole('button', { name: /log\s?out|sign\s?out/i })
      .or(page.getByRole('link', { name: /log\s?out|sign\s?out/i }))
      .or(page.locator('[data-testid="logout"]'))
      .or(page.locator('text=/log\\s?out|sign\\s?out/i'))
      .first();
    await logoutTrigger.click({ timeout: 30000 });
    // After logout, should be redirected to login page
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 30000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
