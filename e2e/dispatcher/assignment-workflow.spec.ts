import { test, expect } from '@playwright/test';

/**
 * Critical Path: Admin – Einsatz-Workflow (Einsätze verwalten, Status).
 * Ohne Auth: Redirect auf Login.
 */
test.describe('Admin Assignment Workflow', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/einsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('einsaetze route is protected and redirect param is preserved', async ({ page }) => {
    await page.goto('/admin/einsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/admin/einsaetze');
  });
});
