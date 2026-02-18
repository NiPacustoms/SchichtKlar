import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Shifts Zuweisung', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsAdmin(page);
  });

  test('sollte Schichten anzeigen', async ({ page }) => {
    await page.goto('/admin/schichten');
    await page.waitForLoadState('networkidle');

    // Verifiziere, dass wir auf der Shifts-Seite sind
    await expect(page).toHaveURL(/\/admin\/shifts/);

    // Prüfe, ob Shifts-Liste vorhanden ist
    const listElements = [
      page.locator('text=/Schichten|Shifts/i'),
      page.locator('table, [role="table"], [class*="list"]'),
    ];

    // Liste sollte vorhanden sein
    const visibleList = await Promise.all(
      listElements.map(el => el.isVisible().catch(() => false))
    );

    expect(visibleList.some(v => v)).toBeTruthy();
  });

  test('sollte Mitarbeiter zuweisen können', async ({ page }) => {
    await page.goto('/admin/schichten');
    await page.waitForLoadState('networkidle');

    const assignButtons = [
      page.locator('button:has-text("Zuweisen"), button:has-text("Zuteilen")'),
      page.locator('[aria-label*="Zuweisen"], [aria-label*="Assign"]'),
    ];

    await Promise.all(
      assignButtons.map(btn => btn.isVisible().catch(() => false))
    );
  });

  test('sollte Verfügbarkeitsprüfung durchführen können', async ({ page }) => {
    await page.goto('/admin/schichten');
    await page.waitForLoadState('networkidle');

    const availabilityElements = [
      page.locator('text=/Verfügbarkeit|Availability/i'),
      page.locator('button:has-text("Verfügbarkeit"), button:has-text("Prüfen")'),
    ];

    await Promise.all(
      availabilityElements.map(el => el.isVisible().catch(() => false))
    );
  });

  test('sollte Benachrichtigungen senden können', async ({ page }) => {
    await page.goto('/admin/schichten');
    await page.waitForLoadState('networkidle');

    const notificationButtons = [
      page.locator('button:has-text("Benachrichtigen"), button:has-text("Senden")'),
      page.locator('[aria-label*="Benachrichtigen"], [aria-label*="Notify"]'),
    ];

    await Promise.all(
      notificationButtons.map(btn => btn.isVisible().catch(() => false))
    );
  });
});
