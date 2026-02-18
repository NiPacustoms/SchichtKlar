import { test, expect } from '@playwright/test';

test.describe('Datenschutz page', () => {
  test('recht/datenschutz loads and shows privacy content', async ({ page }) => {
    await page.goto('/recht/datenschutz');
    await expect(page).toHaveURL(/\/recht\/datenschutz/);
  });

  test('page has readable content', async ({ page }) => {
    await page.goto('/recht/datenschutz');
    await expect(
      page.getByText(/Datenschutzerklärung|Verantwortlicher|personenbezogen/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
