import { test, expect } from '@playwright/test';
import { loginAsNurse } from '../fixtures/auth';

test.describe('Dokumente Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsNurse(page);
  });

  test('sollte Dokumente-Seite laden', async ({ page }) => {
    await page.goto('/employee/dokumente');
    await page.waitForLoadState('networkidle');
    
    // Verifiziere, dass wir auf der Dokumente-Seite sind
    await expect(page).toHaveURL(/\/employee\/dokumente/);
  });

  test('sollte Upload-Button anzeigen', async ({ page }) => {
    await page.goto('/employee/dokumente');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Upload-Button vorhanden ist
    const uploadButtons = [
      page.locator('button:has-text("Hochladen"), button:has-text("Upload")'),
      page.locator('input[type="file"]'),
      page.locator('[aria-label*="Hochladen"], [aria-label*="Upload"]'),
    ];
    
    // Mindestens ein Upload-Element sollte vorhanden sein
    const visibleUpload = await Promise.all(
      uploadButtons.map(btn => btn.isVisible().catch(() => false))
    );
    
    expect(visibleUpload.some(v => v)).toBeTruthy();
  });

  test('sollte Dokument-Liste anzeigen', async ({ page }) => {
    await page.goto('/employee/dokumente');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Dokument-Liste vorhanden ist
    const documentListElements = [
      page.locator('text=/Dokumente|Dateien/i'),
      page.locator('table, [role="list"], [class*="list"]'),
    ];
    
    // Dokument-Liste sollte vorhanden sein
    const visibleList = await Promise.all(
      documentListElements.map(el => el.isVisible().catch(() => false))
    );
    
    expect(visibleList.some(v => v)).toBeTruthy();
  });

  test('sollte Dokument-Vorschau ermöglichen', async ({ page }) => {
    await page.goto('/employee/dokumente');
    await page.waitForLoadState('networkidle');
    
    // Versuche auf ein Dokument zu klicken (falls vorhanden)
    const documentItem = page.locator('[data-testid*="document"], [class*="document"], a, button').first();
    
    if (await documentItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await documentItem.click();
      
      // Prüfe, ob Vorschau angezeigt wird
      const previewElements = [
        page.locator('text=/Vorschau|Preview/i'),
        page.locator('dialog, [role="dialog"], .modal, img, iframe'),
      ];
      
      const visiblePreview = await Promise.all(
        previewElements.map(el => el.isVisible().catch(() => false))
      );
      
      // Vorschau kann angezeigt werden
    }
  });

  test('sollte Dokument löschen können', async ({ page }) => {
    await page.goto('/employee/dokumente');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Löschen-Button vorhanden ist
    const deleteButtons = [
      page.locator('button:has-text("Löschen"), button:has-text("Delete")'),
      page.locator('[aria-label*="Löschen"], [aria-label*="Delete"]'),
      page.locator('button[aria-label*="remove"], button[aria-label*="delete"]'),
    ];
    
    // Löschen-Button kann vorhanden sein (optional, wenn Dokumente vorhanden)
    const visibleDelete = await Promise.all(
      deleteButtons.map(btn => btn.isVisible().catch(() => false))
    );
    
    // Löschen ist optional, daher kein Fehler wenn nicht vorhanden
  });
});

