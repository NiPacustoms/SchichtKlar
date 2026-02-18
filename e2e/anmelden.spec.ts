import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('anmelden page loads', async ({ page }) => {
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
});
