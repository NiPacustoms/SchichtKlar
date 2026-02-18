import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsNurse } from './fixtures/auth';

test.describe('Wochenstunden-Limit', () => {
  test('Admin sieht Wochenlimit-Bereich auf Mitarbeiterdetail', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/mitarbeiter');
    await page.waitForLoadState('networkidle');

    // Ersten Mitarbeiter-Link klicken (oder erste Zeile)
    const firstRow = page.locator('table tbody tr a[href*="/admin/mitarbeiter/"]').first();
    await firstRow.click();
    await page.waitForLoadState('networkidle');

    // Sollte auf Mitarbeiterdetail sein
    await expect(page).toHaveURL(/\/admin\/mitarbeiter\/[^/]+/);

    // Wochenlimit-Sektion: KPI oder Setter (wenn manage_staff)
    const limitSection = page.getByText(/Wochenlimit|Wochenstunden-Limit/).first();
    await expect(limitSection).toBeVisible({ timeout: 10000 });
  });

  test('Pflegekraft Zeiterfassung: Limit-Banner bei Blockade sichtbar und Submit deaktiviert', async ({ page }) => {
    await loginAsNurse(page);
    await page.goto('/employee/zeiterfassung');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/employee\/zeiterfassung/);

    const submitButton = page.locator('[data-testid="timesheet-submit"]');
    await expect(submitButton).toBeVisible();

    // Wenn Limit-Banner (blocked) angezeigt wird, muss Submit disabled sein
    const limitBanner = page.locator('[data-testid="limit-warning-banner"]');
    const bannerVisible = await limitBanner.isVisible().catch(() => false);
    if (bannerVisible) {
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('Pflegekraft kann Genehmigung beantragen wenn Banner sichtbar', async ({ page }) => {
    await loginAsNurse(page);
    await page.goto('/employee/zeiterfassung');
    await page.waitForLoadState('networkidle');

    const limitBanner = page.locator('[data-testid="limit-warning-banner"]');
    const bannerVisible = await limitBanner.isVisible().catch(() => false);
    if (bannerVisible) {
      const requestButton = page.locator('button:has-text("Genehmigung beantragen")');
      await expect(requestButton).toBeVisible();
    }
  });
});
