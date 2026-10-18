import { defineConfig, devices } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'
import { assertLocalSupabaseEnv } from './src/cms/integration-env'

/**
 * Admin CMS end-to-end smoke test (issue #264). How to run it:
 * docs/database-workflow.md, "End-to-end admin smoke test".
 *
 * Runs against a LOCAL Supabase only. The three Supabase variables must be
 * exported explicitly (e.g. from `supabase status -o env`); this throws
 * before anything is built if they are missing or point anywhere but
 * 127.0.0.1/localhost.
 */
const supabaseEnv = assertLocalSupabaseEnv(process.env)

const PORT = Number(process.env.E2E_PORT || 3264)
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * Next.js loads .env.local / .env.production / .env on build and start, and
 * a developer's .env.local points at the shared remote dev project (plus
 * Sentry, Upstash, ...). Next never overrides a variable that is already set,
 * even to an empty string, so blank every key those files define and then
 * set the values the e2e server needs explicitly. Nothing from the files can
 * leak into the server under test.
 */
function blankDotenvKeys(): Record<string, string> {
  const blanked: Record<string, string> = {}
  for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const full = path.join(__dirname, file)
    if (!existsSync(full)) continue
    for (const key of Object.keys(parse(readFileSync(full)))) blanked[key] = ''
  }
  return blanked
}

const serverEnv: Record<string, string> = {
  ...blankDotenvKeys(),
  NEXT_PUBLIC_SUPABASE_URL: supabaseEnv.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseEnv.anonKey,
  SUPABASE_SERVICE_ROLE_KEY: supabaseEnv.serviceRoleKey,
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  NEXT_TELEMETRY_DISABLED: '1',
}

export default defineConfig({
  testDir: './e2e',
  // One worker: the tests share one server and one database, and the
  // lifecycle test is a single ordered story.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // The production CSP (next.config.ts) only allows *.supabase.co in
    // connect-src, so a `next start` build blocks the browser's calls to the
    // local Supabase API (sign-in form, header session check). Production is
    // unaffected; this only lets the browser reach the local stack.
    bypassCSP: true,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'admin',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
    },
  ],
  webServer: {
    // A production build, as deployed. Set E2E_SKIP_BUILD=1 to reuse an
    // existing .next build (it must have been built against the same env).
    command: process.env.E2E_SKIP_BUILD
      ? `npx next start -H 127.0.0.1 -p ${PORT}`
      : `npm run build && npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `${BASE_URL}/`,
    env: serverEnv,
    // Never attach to whatever else is listening on the port: it could be a
    // server pointed at a remote database.
    reuseExistingServer: false,
    timeout: 15 * 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
