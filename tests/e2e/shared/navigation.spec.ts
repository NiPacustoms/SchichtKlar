import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsDispatcher, loginAsNurse } from '../fixtures/auth';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Stelle sicher, dass E2E-Test-Modus aktiviert ist
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
  });

  test.describe('Rollenbasierte Navigation', () => {
    test('sollte Admin-Navigation anzeigen', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Prüfe, ob Admin-Navigation-Elemente sichtbar sind
      // Navigation kann in verschiedenen Komponenten sein (BottomNav, Sidebar, etc.)
      const adminNavItems = [
        page.locator('text=/Übersicht|Dashboard/i'),
        page.locator('text=/Schichten/i'),
        page.locator('text=/Personal|Mitarbeiter/i'),
        page.locator('text=/Standorte|Einrichtungen/i'),
      ];
      
      // Mindestens ein Navigation-Element sollte sichtbar sein
      const visibleItems = await Promise.all(
        adminNavItems.map(item => item.isVisible().catch(() => false))
      );
      
      expect(visibleItems.some(v => v)).toBeTruthy();
    });

    test('sollte Dispatcher-Navigation anzeigen', async ({ page }) => {
      await loginAsDispatcher(page);
      
      // Dispatcher hat ähnliche Navigation wie Admin
      const dispatcherNavItems = [
        page.locator('text=/Übersicht|Dashboard/i'),
        page.locator('text=/Schichten/i'),
      ];
      
      const visibleItems = await Promise.all(
        dispatcherNavItems.map(item => item.isVisible().catch(() => false))
      );
      
      expect(visibleItems.some(v => v)).toBeTruthy();
    });

    test('sollte Nurse-Navigation anzeigen', async ({ page }) => {
      await loginAsNurse(page);
      
      // Prüfe, ob Nurse-Navigation-Elemente sichtbar sind
      const nurseNavItems = [
        page.locator('text=/Home|Dashboard/i'),
        page.locator('text=/Dienstplan/i'),
        page.locator('text=/Zeit|Zeiterfassung/i'),
        page.locator('text=/Profil/i'),
      ];
      
      const visibleItems = await Promise.all(
        nurseNavItems.map(item => item.isVisible().catch(() => false))
      );
      
      expect(visibleItems.some(v => v)).toBeTruthy();
    });
  });

  test.describe('Route Guards', () => {
    test('sollte unauthentifizierte Benutzer zur Login-Seite weiterleiten', async ({ page }) => {
      // Versuche auf geschützte Seite zuzugreifen ohne Login
      await page.goto('/admin/schichten');
      
      // Sollte zur Login-Seite weitergeleitet werden
      await expect(page).toHaveURL(/\/anmelden/);
    });

    test('sollte Nurse nicht auf Admin-Routen zugreifen können', async ({ page }) => {
      await loginAsNurse(page);
      
      // Versuche auf Admin-Route zuzugreifen
      await page.goto('/admin/schichten');
      
      // Sollte Zugriff verweigert werden oder zur Dashboard-Seite weitergeleitet werden
      // Je nach Implementierung kann es eine 403-Seite oder Redirect sein
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/\/admin\/shifts/);
    });

    test('sollte Admin auf alle Admin-Routen zugreifen können', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Teste verschiedene Admin-Routen
      const adminRoutes = [
        '/admin/schichten',
        '/admin/mitarbeiter',
        '/admin/einrichtungen',
      ];
      
      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Verifiziere, dass wir auf der Route sind (kein Redirect zu Login)
        expect(page.url()).toContain(route);
      }
    });

    test('sollte Dispatcher auf Admin-Routen zugreifen können', async ({ page }) => {
      await loginAsDispatcher(page);
      
      // Dispatcher sollte ähnliche Rechte wie Admin haben
      await page.goto('/admin/schichten');
      await page.waitForLoadState('networkidle');
      
      // Verifiziere, dass wir auf der Route sind
      expect(page.url()).toContain('/admin/schichten');
    });
  });

  test.describe('404-Seite', () => {
    test('sollte 404-Seite für nicht existierende Routen anzeigen', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Versuche auf nicht existierende Route zuzugreifen
      await page.goto('/admin/nicht-existierend');
      await page.waitForLoadState('networkidle');
      
      // Prüfe, ob 404-Seite angezeigt wird
      const notFoundText = page.locator('text=/404|Nicht gefunden|Seite nicht gefunden/i');
      await expect(notFoundText.first()).toBeVisible({ timeout: 5000 });
    });

    test('sollte von 404-Seite zurück navigieren können', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Gehe zu 404-Seite
      await page.goto('/admin/nicht-existierend');
      await page.waitForLoadState('networkidle');
      
      // Versuche zurück zu navigieren (z.B. über Link oder Button)
      const backLink = page.locator('a:has-text("Zurück"), button:has-text("Zurück"), a:has-text("Home")').first();
      
      if (await backLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backLink.click();
        await page.waitForLoadState('networkidle');
        
        // Sollte von 404-Seite weg navigiert haben
        expect(page.url()).not.toContain('nicht-existierend');
      }
    });
  });

  test.describe('Navigation zwischen Seiten', () => {
    test('sollte zwischen Admin-Seiten navigieren können', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigiere zu verschiedenen Admin-Seiten
      await page.goto('/admin/schichten');
      await expect(page).toHaveURL(/\/admin\/shifts/);
      
      await page.goto('/admin/mitarbeiter');
      await expect(page).toHaveURL(/\/admin\/mitarbeiter/);
      
      await page.goto('/admin/einrichtungen');
      await expect(page).toHaveURL(/\/admin\/einrichtungen/);
    });

    test('sollte zwischen Nurse-Seiten navigieren können', async ({ page }) => {
      await loginAsNurse(page);
      
      // Navigiere zu verschiedenen Nurse-Seiten
      await page.goto('/employee/dashboard');
      await expect(page).toHaveURL(/\/employee\/dashboard/);
      
      await page.goto('/employee/dienstplan');
      await expect(page).toHaveURL(/\/employee\/dienstplan/);
      
      await page.goto('/employee/zeiterfassung');
      await expect(page).toHaveURL(/\/employee\/zeiterfassung/);
    });
  });
});

