#!/usr/bin/env node
/**
 * UI-Screenshots aller Hauptseiten (Desktop + Mobil) gegen den lokalen Dev-Server
 * mit Emulator-Demodaten (scripts/seed-emulator-demo.mjs).
 *
 *   node scripts/ui-screenshots.mjs <ausgabeordner> [routen-filter]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || 'ui-shots';
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;
mkdirSync(OUT, { recursive: true });

const PUBLIC = ['/', '/anmelden', '/registrieren', '/passwort-vergessen', '/recht/impressum'];
const ADMIN = [
  '/admin', '/admin/uebersicht', '/admin/dienstplan', '/admin/schichten', '/admin/einsaetze',
  '/admin/einsaetze/new', '/admin/mitarbeiter', '/admin/einrichtungen', '/admin/stunden',
  '/admin/berichte', '/admin/einstellungen', '/admin/aktivitaeten', '/admin/dokumenttypen',
  '/admin/pruefprotokolle', '/benachrichtigungen', '/nachrichten', '/profil',
];
const EMPLOYEE = [
  '/employee/arbeitsplatz', '/employee/dienstplan', '/employee/einsaetze', '/employee/einsaetze/a-angebot-1',
  '/employee/zeiterfassung', '/employee/zeiten', '/employee/dokumente', '/employee/profil',
  '/employee/benachrichtigungen', '/employee/berichte',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const slug = r => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '__'));

async function login(page, email) {
  await page.goto(`${BASE}/anmelden`, { waitUntil: 'load' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', 'Demo1234!');
  await page.click('button[aria-label="Anmelden"]');
  await page.waitForURL(u => !u.pathname.startsWith('/anmelden'), { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function shoot(context, routes, prefix, vp) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`${page.url()} ${e.message}`));
  for (const r of routes) {
    if (FILTER && !FILTER.test(r)) continue;
    try {
      await page.goto(`${BASE}${r}`, { waitUntil: 'load', timeout: 30_000 });
    } catch {
      /* networkidle kann bei Realtime-Listenern ausbleiben */
    }
    await page.waitForTimeout(3500);
    const file = join(OUT, `${prefix}-${vp.name}-${slug(r)}.png`);
    await page.screenshot({ path: file, fullPage: vp.name === 'desktop' ? false : false });
    console.log(`${file}  (${page.url().replace(BASE, '')})`);
  }
  await page.close();
  return errors;
}

const browser = await chromium.launch();
const allErrors = [];
for (const vp of VIEWPORTS) {
  const opts = { viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1, locale: 'de-DE', timezoneId: 'Europe/Berlin' };

  const mk = async () => {
    const c = await browser.newContext(opts);
    // Cookie-Banner für Screenshots ausblenden (Einwilligung vorab gesetzt)
    await c.addInitScript(() => {
      try { localStorage.setItem('cookieConsent', 'declined'); } catch {}
    });
    return c;
  };
  const pub = await mk();
  allErrors.push(...(await shoot(pub, PUBLIC, 'public', vp)));
  await pub.close();

  const adm = await mk();
  const p1 = await adm.newPage();
  await login(p1, 'admin@demo.schichtklar.de');
  await p1.close();
  allErrors.push(...(await shoot(adm, ADMIN, 'admin', vp)));
  await adm.close();

  const emp = await mk();
  const p2 = await emp.newPage();
  await login(p2, 'lea.becker@demo.schichtklar.de');
  await p2.close();
  allErrors.push(...(await shoot(emp, EMPLOYEE, 'employee', vp)));
  await emp.close();
}
await browser.close();
if (allErrors.length) {
  console.log('\nJS-Fehler:');
  for (const e of [...new Set(allErrors)]) console.log(' -', e.slice(0, 240));
}
