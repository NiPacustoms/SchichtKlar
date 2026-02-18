import { test, expect } from '@playwright/test';

/**
 * Critical Path: RBAC – Rollenbasierter Zugriff (Admin vs. Mitarbeiter).
 * Ohne Auth: Geschützte Routen leiten auf Login um.
 */
test.describe('RBAC Permissions', () => {
  test('admin route without auth redirects to login', async ({ page }) => {
    await page.goto('/admin/uebersicht', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('employee route without auth redirects to login', async ({ page }) => {
    await page.goto('/employee/arbeitsplatz', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login page is accessible and shows form', async ({ page }) => {
    await page.goto('/anmelden', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible({ timeout: 20000 });
  });
});
