import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // jsdom, damit clientseitige Service-/Hook-Guards (`typeof window`) und
    // React-Rendering (@testing-library/react) funktionieren.
    environment: 'jsdom',
    include: ['lib/**/__tests__/**/*.test.ts', 'lib/**/__tests__/**/*.test.tsx', 'lib/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e', 'functions/**'],
    coverage: {
      provider: 'v8',
      enabled: false,
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/__tests__/**',
        'lib/**/*.test.ts',
        '**/*.d.ts',
        '**/index.ts',
      ],
      reporter: ['text', 'text-summary', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
