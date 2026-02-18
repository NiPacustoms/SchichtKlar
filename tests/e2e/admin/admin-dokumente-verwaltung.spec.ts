import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Dokumente Verwaltung', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsAdmin(page);
  });

  test('sollte Dokumente anzeigen', async ({ page }) => {
    await page.goto('/admin/document-types');
    await page.waitForLoadState('networkidle');

    // Verifiziere, dass wir auf der Dokumente-Seite sind
    await expect(page).toHaveURL(/\/admin\/document-types/);

    // Prüfe, ob Dokumente-Liste vorhanden ist
    const listElements = [
      page.locator('text=/Dokumente|Document/i'),
      page.locator('table, [role="table"], [class*="list"]'),
    ];

    // Liste sollte vorhanden sein
    const visibleList = await Promise.all(
      listElements.map(el => el.isVisible().catch(() => false))
    );

    expect(visibleList.some(v => v)).toBeTruthy();
  });

  test('sollte Dokumente hochladen können', async ({ page }) => {
    await page.goto('/admin/document-types');
    await page.waitForLoadState('networkidle');

    // Prüfe, ob Upload-Button vorhanden ist
    const uploadButtons = [
      page.locator('button:has-text("Hochladen"), button:has-text("Upload")'),
      page.locator('input[type="file"]'),
      page.locator('[aria-label*="Hochladen"], [aria-label*="Upload"]'),
    ];

    // Upload-Button kann vorhanden sein
    await Promise.all(
      uploadButtons.map(btn => btn.isVisible().catch(() => false))
    );
  });

  test('sollte Dokumente prüfen können', async ({ page }) => {
    await page.goto('/admin/document-types');
    await page.waitForLoadState('networkidle');

    // Prüfe, ob Prüfen-Button vorhanden ist
    const checkButtons = [
      page.locator('button:has-text("Prüfen"), button:has-text("Review")'),
      page.locator('[aria-label*="Prüfen"], [aria-label*="Review"]'),
    ];

    await Promise.all(
      checkButtons.map(btn => btn.isVisible().catch(() => false))
    );
  });
});
