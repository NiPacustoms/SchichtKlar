import { test, expect } from '@playwright/test';
import { loginAsDispatcher } from '../fixtures/auth';

test.describe('Dispatcher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    await loginAsDispatcher(page);
  });

  test('sollte Dispatcher-Dashboard laden', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verifiziere, dass wir auf dem Dashboard sind
    await expect(page).toHaveURL(/\/admin/);
    
    // Prüfe, ob Dashboard-Elemente vorhanden sind
    const dashboardElements = [
      page.locator('text=/Dashboard|Übersicht/i'),
      page.locator('text=/KPI|Statistiken/i'),
    ];
    
    // Mindestens ein Element sollte sichtbar sein
    const visibleElements = await Promise.all(
      dashboardElements.map(el => el.isVisible().catch(() => false))
    );
    
    expect(visibleElements.some(v => v)).toBeTruthy();
  });

  test('sollte Navigation prüfen', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Prüfe, ob Navigation-Elemente vorhanden sind
    const navElements = [
      page.locator('text=/Schichten|Shifts/i'),
      page.locator('a:has-text("Schichten"), button:has-text("Schichten")'),
    ];
    
    // Navigation sollte vorhanden sein
    const visibleNav = await Promise.all(
      navElements.map(el => el.isVisible().catch(() => false))
    );
    
    expect(visibleNav.some(v => v)).toBeTruthy();
  });
});

