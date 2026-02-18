import { test, expect } from '@playwright/test';

/**
 * Critical Path: Admin – Stundenerfassung genehmigen (Stunden / Facility Hours).
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Admin Timesheet Approval', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/stunden', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login with redirect to stunden shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Fadmin%2Fstunden', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible({ timeout: 20000 });
  });
});
