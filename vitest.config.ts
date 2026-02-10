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
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/lib/cache.ts',
        'src/lib/schema.ts',
        'src/lib/markdown-server.ts',
        'src/lib/content-metadata.ts',
        'src/lib/quantum-dictionary.ts',
        'src/lib/redirect-utils.ts',
        'src/lib/spelling-patterns.ts',
        'src/lib/content-validation.ts',
        'src/lib/supabase-untyped.ts',
        'src/lib/validation/schemas.ts',
        'src/utils/form-validation.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
