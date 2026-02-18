import { test, expect } from '@playwright/test';

/**
 * Critical Path: Mitarbeiter – Zeiten einreichen / Zeiterfassung einsehen.
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Employee Timesheet Submit', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/employee/zeiten', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login with redirect to zeiten shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Femployee%2Fzeiten', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible({ timeout: 20000 });
  });
});
