import { test, expect } from '@playwright/test';

test.describe('Home / Landing', () => {
  test('home page loads and shows JobFlow content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JobFlow|Zeitarbeit/i);
  });

  test('login link or button is present', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /anmelden|login|einloggen/i }).or(
        page.getByRole('button', { name: /anmelden|login/i })
      )
    ).toBeVisible({ timeout: 10000 });
  });
});
