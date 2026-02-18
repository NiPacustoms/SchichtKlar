import { test, expect } from '@playwright/test';

/**
 * Kritische Flows: Geschützte Routen leiten auf Login um;
 * Login-Seite mit Redirect-Param zeigt Formular.
 * (Echte Anmeldung würde Test-User/Emulator erfordern.)
 */

test.describe('Mitarbeiter Einsätze (/employee/einsaetze)', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/employee/einsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login page with redirect to einsaetze shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Femployee%2Feinsaetze', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(
      page.getByLabel(/e-mail|e-mailadresse|email/i).or(page.getByPlaceholder(/e-mail|email/i))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mitarbeiter Zeiterfassung (/employee/zeiterfassung)', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/employee/zeiterfassung', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login page with redirect to zeiterfassung shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Femployee%2Fzeiterfassung', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    await expect(
      page.getByRole('heading', { name: /anmelden|login/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Übersicht (/admin/uebersicht)', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin/uebersicht', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/, { timeout: 20000 });
  });

  test('login page with redirect to admin shows form', async ({ page }) => {
    await page.goto('/anmelden?redirect=%2Fadmin%2Fuebersicht', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/anmelden/);
    const submit = page.getByRole('button', { name: /anmelden|einloggen|login/i });
    await expect(submit).toBeVisible({ timeout: 5000 });
  });
});
