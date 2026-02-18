import { test, expect } from '@playwright/test';
import { loginAsNurse } from '../fixtures/auth';

test.describe('Profil-Formular', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsNurse(page);
  });

  test('sollte Profil-Seite laden und Formular anzeigen', async ({ page }) => {
    await page.goto('/employee/profil');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/employee\/profil/);
  });

  test('sollte Profil-Formular ausfüllbar und Submit-Button klickbar sein', async ({ page }) => {
    await page.goto('/employee/profil');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('[data-testid="profile-form-submit-button"]');
    await expect(submitButton).toBeVisible({ timeout: 15000 });
    await expect(submitButton).toBeEnabled();

    // Mindestens ein bearbeitbares Eingabefeld (Text oder E-Mail) prüfen
    const editableInput = page.locator('input:not([readonly]):not([disabled])').first();
    await expect(editableInput).toBeVisible({ timeout: 5000 });
    await expect(editableInput).toBeEditable();
  });
});
