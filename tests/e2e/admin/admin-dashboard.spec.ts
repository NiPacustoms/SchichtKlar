import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsAdmin(page);
  });

  test('sollte Admin-Dashboard laden', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verifiziere, dass wir auf dem Admin-Dashboard sind
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Prüfe, ob Dashboard-Elemente vorhanden sind
    const dashboardElements = [
      page.locator('text=/Admin Dashboard|Übersicht/i'),
      page.locator('text=/KPI|Statistiken/i'),
    ];
    
    // Mindestens ein Element sollte sichtbar sein
    const visibleElements = await Promise.all(
      dashboardElements.map(el => el.isVisible().catch(() => false))
    );
    
    expect(visibleElements.some(v => v)).toBeTruthy();
  });

  test('sollte KPIs anzeigen', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob KPI-Elemente vorhanden sind
    const kpiElements = [
      page.locator('text=/Mitarbeiter|Personal/i'),
      page.locator('text=/Schichten|Assignments/i'),
      page.locator('text=/Stunden|Zeit/i'),
    ];
    
    // Mindestens ein KPI sollte sichtbar sein
    const visibleKPIs = await Promise.all(
      kpiElements.map(kpi => kpi.isVisible().catch(() => false))
    );
    
    expect(visibleKPIs.some(v => v)).toBeTruthy();
  });

  test('sollte Quick Actions anzeigen', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Quick Actions vorhanden sind
    const quickActionElements = [
      page.locator('button:has-text("Schicht erstellen"), button:has-text("Mitarbeiter hinzufügen")'),
      page.locator('text=/Quick Actions|Schnellaktionen/i'),
    ];
    
    // Quick Actions sollten vorhanden sein
    const visibleActions = await Promise.all(
      quickActionElements.map(action => action.isVisible().catch(() => false))
    );
    
    expect(visibleActions.some(v => v)).toBeTruthy();
  });

  test('sollte Alerts anzeigen', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Alerts-Panel vorhanden ist
    const alertElements = [
      page.locator('text=/Alerts|Warnungen|Hinweise/i'),
      page.locator('[role="alert"], .alert, [class*="alert"]'),
    ];
    
    // Alerts können vorhanden sein (auch wenn leer)
    const visibleAlerts = await Promise.all(
      alertElements.map(alert => alert.isVisible().catch(() => false))
    );
    
    // Alerts-Section sollte vorhanden sein
    expect(visibleAlerts.some(v => v)).toBeTruthy();
  });

  test('sollte Navigation zu allen Admin-Bereichen ermöglichen', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Navigation zu verschiedenen Admin-Bereichen möglich ist
    const adminRoutes = [
      '/admin/schichten',
      '/admin/mitarbeiter',
      '/admin/einrichtungen',
    ];
    
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Verifiziere, dass wir auf der Route sind
      expect(page.url()).toContain(route);
    }
  });
});

