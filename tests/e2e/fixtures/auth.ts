import { Page, expect } from '@playwright/test';

/**
 * Login-Helper für alle Rollen
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login als Admin
 */
export async function loginAsAdmin(page: Page, credentials?: LoginCredentials): Promise<void> {
  const email = credentials?.email || process.env.E2E_ADMIN_EMAIL || 'admin@test.jobflow.local';
  const password = credentials?.password || process.env.E2E_ADMIN_PASSWORD || 'test-admin-password';

  await page.goto('/anmelden');
  await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Warte auf Weiterleitung nach Login
  await page.waitForURL(/\/admin\//, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  // Verifiziere, dass wir eingeloggt sind
  await expect(page).toHaveURL(/\/admin/);
}

/**
 * Login als Nurse (Mitarbeiter)
 */
export async function loginAsNurse(page: Page, credentials?: LoginCredentials): Promise<void> {
  const email = credentials?.email || process.env.E2E_EMPLOYEE_EMAIL || 'nurse@test.jobflow.local';
  const password = credentials?.password || process.env.E2E_EMPLOYEE_PASSWORD || 'test-nurse-password';

  await page.goto('/anmelden');
  await page.waitForSelector('[data-testid="email-input"]', { state: 'visible' });
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Warte auf Weiterleitung nach Login
  await page.waitForURL(/\/employee\/arbeitsplatz/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  // Verifiziere, dass wir eingeloggt sind
  await expect(page).toHaveURL(/\/employee\/arbeitsplatz/);
}

/**
 * Logout
 */
export async function logout(page: Page): Promise<void> {
  // Suche nach Logout-Button (bevorzuge data-testid, dann Fallback auf Text/aria-label)
  const logoutButton = page.locator('[data-testid="logout-button"]').first();
  
  if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/\/anmelden/, { timeout: 10000 });
  } else {
    // Fallback: Suche nach Text oder aria-label
    const fallbackButton = page.locator('button:has-text("Abmelden"), button:has-text("Logout"), [aria-label*="Abmelden"], [aria-label*="Logout"]').first();
    if (await fallbackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fallbackButton.click();
      await page.waitForURL(/\/anmelden/, { timeout: 10000 });
    } else {
      // Letzter Fallback: Direkt zur Login-Seite navigieren
      await page.goto('/anmelden');
    }
  }
  
  // Verifiziere, dass wir ausgeloggt sind
  await expect(page).toHaveURL(/\/anmelden/);
}

/**
 * Prüft, ob der Benutzer eingeloggt ist
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return !currentUrl.includes('/anmelden') && !currentUrl.includes('/registrieren');
}

