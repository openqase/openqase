import { defineConfig } from 'vitest/config'
import path from 'path'

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
    env: {
      // Vitest inherits process.env; .env files are loaded by the setupFile
    },
    setupFiles: ['./src/cms/smoke-setup.ts'],
  },
})
