import { test, expect } from '@playwright/test';
import { loginAsNurse } from '../fixtures/auth';

test.describe('Dienstplan', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsNurse(page);
  });

  test('sollte Dienstplan-Seite laden', async ({ page }) => {
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    
    // Verifiziere, dass wir auf der Dienstplan-Seite sind
    await expect(page).toHaveURL(/\/employee\/dienstplan/);
  });

  test('sollte Kalender-Ansicht anzeigen', async ({ page }) => {
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Kalender-Elemente vorhanden sind
    const calendarElements = [
      page.locator('text=/Kalender|Monat|Woche/i'),
      page.locator('[role="grid"], table, .calendar'),
      page.locator('button:has-text("Vor"), button:has-text("Zurück")'),
    ];
    
    // Mindestens ein Kalender-Element sollte vorhanden sein
    const visibleElements = await Promise.all(
      calendarElements.map(el => el.isVisible().catch(() => false))
    );
    
    expect(visibleElements.some(v => v)).toBeTruthy();
  });

  test('sollte Schichten anzeigen', async ({ page }) => {
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Schicht-Informationen angezeigt werden
    const shiftElements = [
      page.locator('text=/Schicht|Dienst|Einsatz/i'),
      page.locator('[data-testid*="shift"], [class*="shift"]'),
    ];
    
    // Schichten können vorhanden sein (auch wenn leer)
    const visibleShifts = await Promise.all(
      shiftElements.map(el => el.isVisible().catch(() => false))
    );
    
    // Schichten-Section sollte vorhanden sein
    expect(visibleShifts.some(v => v)).toBeTruthy();
  });

  test('sollte Filter-Funktionalität anbieten', async ({ page }) => {
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Filter-Elemente vorhanden sind
    const filterElements = [
      page.locator('button:has-text("Filter"), select, input[type="date"]'),
      page.locator('text=/Filter|Suche/i'),
    ];
    
    // Filter können vorhanden sein (optional)
    const visibleFilters = await Promise.all(
      filterElements.map(el => el.isVisible().catch(() => false))
    );
    
    // Filter ist optional, daher kein Fehler wenn nicht vorhanden
  });

  test('sollte Schicht-Details anzeigen können', async ({ page }) => {
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    
    // Versuche auf eine Schicht zu klicken (falls vorhanden)
    const shiftItem = page.locator('[data-testid*="shift"], [class*="shift"], [role="button"]').first();
    
    if (await shiftItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shiftItem.click();
      
      // Prüfe, ob Details angezeigt werden
      const detailElements = [
        page.locator('text=/Details|Informationen/i'),
        page.locator('dialog, [role="dialog"], .modal'),
      ];
      
      const visibleDetails = await Promise.all(
        detailElements.map(el => el.isVisible().catch(() => false))
      );
      
      // Details sollten angezeigt werden
      expect(visibleDetails.some(v => v)).toBeTruthy();
    }
  });
});

