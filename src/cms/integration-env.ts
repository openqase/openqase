/**
 * Environment guard for the integration test run (vitest.integration.config.ts).
 *
 * Integration tests read and write a real database, so they only ever run
 * against a local Supabase stack (`supabase start`). The values must be passed
 * explicitly in the environment (CI reads them from `supabase status`); no
 * .env file is loaded, because .env.local points at the shared dev project.
 */

const LOCAL_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]'])

export interface IntegrationSupabaseEnv {
  url: string
  anonKey: string
  serviceRoleKey: string
}

const HOW_TO =
  'Start the local stack and export its values, e.g.\n' +
  '  npx supabase start\n' +
  '  eval "$(npx supabase status -o env --override-name api.url=NEXT_PUBLIC_SUPABASE_URL,' +
  'auth.publishable_key=NEXT_PUBLIC_SUPABASE_ANON_KEY,auth.secret_key=SUPABASE_SERVICE_ROLE_KEY)"\n' +
  '  npm run test:integration\n' +
  'See docs/database-workflow.md.'

export function assertLocalSupabaseEnv(env: Record<string, string | undefined>): IntegrationSupabaseEnv {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''

  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean)
  if (missing.length > 0) {
    throw new Error(
      `Integration tests need ${missing.join(', ')} set explicitly in the environment ` +
        `(.env files are deliberately not loaded).\n${HOW_TO}`
    )
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Integration tests: NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${url}`)
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !LOCAL_HOSTNAMES.has(parsed.hostname)) {
    throw new Error(
      `Integration tests refuse to run against ${parsed.protocol}//${parsed.host}: NEXT_PUBLIC_SUPABASE_URL ` +
        `must point at a local Supabase (127.0.0.1, localhost or [::1]).\n${HOW_TO}`
    )
  }

  return { url, anonKey, serviceRoleKey }
}
