import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Lade .env.e2e falls vorhanden
dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

/**
 * Playwright Konfiguration für JobFlow E2E-Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Maximale Ausführungszeit pro Test */
  timeout: 60 * 1000,
  
  /* Maximale Ausführungszeit pro Test-Suite */
  expect: {
    timeout: 5000,
  },
  
  /* Tests parallel ausführen */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot bei Fehlern */
    screenshot: 'only-on-failure',
    
    /* Video bei Fehlern */
    video: 'retain-on-failure',
    
    /* Viewport für Desktop-First Design */
    viewport: { width: 1440, height: 900 },
    
    /* Action Timeout */
    actionTimeout: 10000,
    
    /* Navigation Timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // Deaktiviere webServer wenn E2E_SKIP_SERVER gesetzt ist oder CI läuft
  webServer: (process.env.CI || process.env.E2E_SKIP_SERVER) ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Verwende bestehenden Server wenn verfügbar
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

