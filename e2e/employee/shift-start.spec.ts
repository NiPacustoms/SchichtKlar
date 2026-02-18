import { test, expect } from '@playwright/test';

/**
 * Critical Path: Mitarbeiter – Schicht starten (Zeiterfassung).
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Employee Shift Start', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/employee/zeiterfassung', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login with redirect to zeiterfassung shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Femployee%2Fzeiterfassung', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible({ timeout: 20000 });
  });
});
