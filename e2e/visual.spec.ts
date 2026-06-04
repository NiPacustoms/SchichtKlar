import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.use({ colorScheme: 'light' });

  test('Login-Seite sieht korrekt aus', async ({ page }) => {
    await page.goto('/anmelden', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('Startseite sieht korrekt aus', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('home-light.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression – Dark Mode', () => {
  test.use({ colorScheme: 'dark' });

  test('Login-Seite im Dark-Mode', async ({ page }) => {
    await page.goto('/anmelden', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-dark.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });
});
