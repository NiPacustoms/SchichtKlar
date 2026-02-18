import { test, expect } from '@playwright/test';

/**
 * Critical Path: Admin – Dokumente/Vorlagen hochladen und verwalten.
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Admin Document Upload', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/dokumente/vorlagen', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login with redirect to dokumente shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Fadmin%2Fdokumente%2Fvorlagen', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible({ timeout: 20000 });
  });
});
