import { defineConfig } from 'vitest/config'
import path from 'path'

// Integration tests run against a local Supabase only. Credentials come from
// the environment (CI reads them from `supabase status`); no .env file is
// loaded. The setup file refuses missing values and non-local URLs.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30000,
    setupFiles: ['./src/cms/smoke-setup.ts'],
  },
})
