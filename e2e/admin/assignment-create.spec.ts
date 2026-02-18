import { test, expect } from '@playwright/test';

/**
 * Critical Path: Admin – Einsatz anlegen / Einsätze verwalten.
 * Ohne Auth: Redirect auf Login. Mit Auth (später): Einsatzliste oder Anlage-UI.
 */
test.describe('Admin Assignment Create', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/einsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 25000 });
  });

  test('login page preserves redirect to einsaetze', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Fadmin%2Feinsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByTestId('login-button')).toBeVisible({ timeout: 20000 });
  });
});
