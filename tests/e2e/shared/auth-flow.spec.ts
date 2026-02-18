import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsNurse, logout } from '../fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Stelle sicher, dass E2E-Test-Modus aktiviert ist
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
  });

  test.describe('Login', () => {
    test('sollte mit gültigen Admin-Credentials einloggen', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Verifiziere, dass wir auf der Admin-Seite sind
      await expect(page).toHaveURL(/\/admin\//);
    });

    test('sollte mit gültigen Nurse-Credentials einloggen', async ({ page }) => {
      await loginAsNurse(page);
      
      // Verifiziere, dass wir auf dem Dashboard sind
      await expect(page).toHaveURL(/\/employee\/arbeitsplatz/);
    });

    test('sollte bei ungültigen Credentials einen Fehler anzeigen', async ({ page }) => {
      await page.goto('/anmelden');
      await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
      
      await page.fill('[data-testid="email-input"]', 'invalid@test.com');
      await page.fill('[data-testid="password-input"]', 'wrong-password');
      await page.click('[data-testid="login-button"]');
      
      // Warte auf Fehlermeldung
      await expect(page.locator('text=/Fehler|Ungültig|Falsch/i')).toBeVisible({ timeout: 5000 });
      
      // Verifiziere, dass wir noch auf der Login-Seite sind
      await expect(page).toHaveURL(/\/anmelden/);
    });

    test('sollte bei leerem E-Mail-Feld Validierungsfehler anzeigen', async ({ page }) => {
      await page.goto('/anmelden');
      await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
      
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Warte auf Validierungsfehler
      await expect(page.locator('text=/E-Mail|email/i')).toBeVisible({ timeout: 2000 });
    });

    test('sollte bei leerem Passwort-Feld Validierungsfehler anzeigen', async ({ page }) => {
      await page.goto('/anmelden');
      await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
      
      await page.fill('[data-testid="email-input"]', 'test@test.com');
      await page.click('[data-testid="login-button"]');
      
      // Warte auf Validierungsfehler
      await expect(page.locator('text=/Passwort|password/i')).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Logout', () => {
    test('sollte als Admin ausloggen können', async ({ page }) => {
      await loginAsAdmin(page);
      await logout(page);
      
      // Verifiziere, dass wir auf der Login-Seite sind
      await expect(page).toHaveURL(/\/anmelden/);
    });

    test('sollte als Nurse ausloggen können', async ({ page }) => {
      await loginAsNurse(page);
      await logout(page);
      
      // Verifiziere, dass wir auf der Login-Seite sind
      await expect(page).toHaveURL(/\/anmelden/);
    });
  });

  test.describe('Session-Persistierung', () => {
    test('sollte Session nach Seiten-Reload beibehalten', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Verifiziere, dass wir eingeloggt sind
      await expect(page).toHaveURL(/\/admin\//);
      
      // Reload der Seite
      await page.reload();
      
      // Verifiziere, dass wir noch eingeloggt sind
      await expect(page).toHaveURL(/\/admin\//);
    });

    test('sollte nach Logout nicht mehr eingeloggt sein', async ({ page }) => {
      await loginAsNurse(page);
      await logout(page);
      
      // Versuche auf geschützte Seite zuzugreifen
      await page.goto('/dashboard');
      
      // Sollte zur Login-Seite weitergeleitet werden
      await expect(page).toHaveURL(/\/anmelden/);
    });
  });

  test.describe('Passwort-Reset', () => {
    test('sollte Link "Passwort vergessen?" anzeigen', async ({ page }) => {
      await page.goto('/anmelden');
      await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
      
      // Prüfe, ob Link vorhanden ist
      const forgotPasswordLink = page.locator('a:has-text("Passwort vergessen")');
      await expect(forgotPasswordLink).toBeVisible();
    });

    test('sollte zur Passwort-Reset-Seite navigieren', async ({ page }) => {
      await page.goto('/anmelden');
      await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
      
      const forgotPasswordLink = page.locator('a:has-text("Passwort vergessen")').first();
      await forgotPasswordLink.click();
      
      // Verifiziere, dass wir auf der Passwort-Reset-Seite sind
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });
});

