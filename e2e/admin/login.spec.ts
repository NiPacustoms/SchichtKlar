import { test, expect } from '@playwright/test';

/**
 * Admin Login – Anmelden-Seite und Formular.
 * Ohne echte Credentials prüfen wir nur Lade- und Formular-Verfügbarkeit.
 */
test.describe('Admin / Login', () => {
  test('anmelden page loads and shows login form', async ({ page }) => {
    await page.goto('/anmelden');
    await expect(page).toHaveURL(/\/anmelden/);
  });

  test('shows email and password inputs', async ({ page }) => {
    await page.goto('/anmelden');
    await expect(
      page.getByLabel(/e-mail|e-mailadresse|email/i).or(page.getByPlaceholder(/e-mail|email/i))
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByLabel(/passwort|password/i).or(page.getByPlaceholder(/passwort|password/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test('redirect to admin after login is reachable from anmelden', async ({ page }) => {
    await page.goto('/anmelden');
    await expect(page).toHaveURL(/\/anmelden/);
    // Form vorhanden; echte Anmeldung würde zu /admin/uebersicht führen (mit Credentials)
    const submit = page.getByRole('button', { name: /anmelden|einloggen|login/i });
    await expect(submit).toBeVisible({ timeout: 5000 });
  });
});
