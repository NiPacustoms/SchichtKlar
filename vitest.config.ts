import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'lib/**/__tests__/**/*.test.ts',
      'lib/**/*.test.ts',
      'components/**/__tests__/**/*.test.tsx',
      'components/**/*.test.tsx',
    ],
    exclude: ['node_modules', '.next', 'e2e', 'functions/**'],
    coverage: {
      provider: 'v8',
      enabled: false,
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: [
        'lib/**/__tests__/**',
        'lib/**/*.test.ts',
        'components/**/__tests__/**',
        'components/**/*.test.tsx',
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
