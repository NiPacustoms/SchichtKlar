import { defineConfig } from 'vitest/config';

// Unit-Tests der Cloud Functions (ohne Emulator). Läuft absichtlich in UTC,
// damit Zeitzonenfehler wie auf Cloud Functions auffallen.
export default defineConfig({
  test: {
    root: __dirname,
    include: ['test/**/*.test.ts'],
    // dsr.test.ts erwartet Handler-Exporte, die es in src/dsr nicht (mehr) gibt –
    // lief nie in einem Runner; separat zu reparieren.
    exclude: ['test/dsr.test.ts', 'node_modules/**'],
    environment: 'node',
    env: { TZ: 'UTC' },
  },
});
