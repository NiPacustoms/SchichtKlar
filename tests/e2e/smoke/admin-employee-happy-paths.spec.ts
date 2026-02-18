import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsNurse } from '../fixtures/auth';

test.describe('Smoke: Admin & Employee Happy Paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
  });

  test('Admin Happy Path: Login → Dashboard → Kernbereiche erreichbar', async ({ page }) => {
    await loginAsAdmin(page);

    // Admin-Dashboard
    await page.goto('/admin/uebersicht');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Kernbereiche kurz ansteuern (ohne heavy Interaktionen)
    const adminRoutes = ['/admin/schichten', '/admin/mitarbeiter', '/admin/einrichtungen'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain(route);
    }
  });

  test('Employee Happy Path: Login → Dashboard → Dienstplan sichtbar', async ({ page }) => {
    await loginAsNurse(page);

    // Employee-Dashboard
    await page.goto('/employee/arbeitsplatz');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/employee\/dashboard/);

    // Dienstplan-Seite öffnen und auf grundlegende Inhalte prüfen
    await page.goto('/employee/dienstplan');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/employee\/dienstplan/);

    // Mindestens ein Dienstplan-bezogenes Element sollte vorhanden sein
    const possibleSelectors = [
      page.locator('text=/Dienstplan|Einsatzplan/i'),
      page.locator('[data-testid="schedule-view"]'),
    ];
    const visibilities = await Promise.all(
      possibleSelectors.map((locator) => locator.isVisible().catch(() => false)),
    );
    expect(visibilities.some(Boolean)).toBeTruthy();
  });
});

