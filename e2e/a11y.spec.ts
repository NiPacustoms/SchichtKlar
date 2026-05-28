import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe WCAG)', () => {
  test('Startseite hat keine kritischen a11y-Verstöße', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('#__next script') // Service-Worker-Inline-Scripts
      .analyze();
    expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('Login-Seite hat keine kritischen a11y-Verstöße', async ({ page }) => {
    await page.goto('/anmelden', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('Impressum hat keine kritischen a11y-Verstöße', async ({ page }) => {
    await page.goto('/recht/impressum', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('Skip-Link ist im DOM vorhanden', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const skipLink = page.getByRole('link', { name: /Zum Hauptinhalt/i });
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});
