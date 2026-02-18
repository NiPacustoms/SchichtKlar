import { test, expect } from '@playwright/test';

test.describe('Impressum page', () => {
  test('recht/impressum loads', async ({ page }) => {
    await page.goto('/recht/impressum');
    await expect(page).toHaveURL(/\/recht\/impressum/);
  });

  test('page has main content', async ({ page }) => {
    await page.goto('/recht/impressum');
    await expect(
      page.getByText(/Impressum|Angaben gemäß|Verantwortlich/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
