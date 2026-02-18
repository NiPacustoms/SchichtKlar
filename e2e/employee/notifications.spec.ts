import { test, expect } from '@playwright/test';

/**
 * Critical Path: Mitarbeiter – Benachrichtigungen einsehen.
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Employee Notifications', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/employee/benachrichtigungen', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login with redirect to benachrichtigungen shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Femployee%2Fbenachrichtigungen', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByTestId('login-button')).toBeVisible({ timeout: 20000 });
  });
});
