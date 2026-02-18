/**
 * In CI: Wartet bis der Dev-Server auf baseURL antwortet (CI startet den Server vor den Tests).
 * Lokal: Kein Warten – Playwright startet den Server per webServer nach dem Setup und wartet selbst auf Bereitschaft.
 */
import type { FullConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const maxWaitMs = 120_000;
const intervalMs = 2_000;

async function waitForServer(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(baseURL, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (res.ok || res.status === 304) return;
    } catch {
      // Server noch nicht bereit
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Server unter ${baseURL} nach ${maxWaitMs / 1000}s nicht erreichbar. Bitte "npm run dev" starten.`);
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.CI) {
    await waitForServer();
  }
  // Lokal: Playwright webServer startet den Server nach dem Setup und wartet auf Bereitschaft
}
