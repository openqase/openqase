import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { assertLocalSupabaseEnv } from '../src/cms/integration-env'
import { getAllContentTypes, getContentType } from '../src/cms/registry'

/**
 * Every row the e2e suite creates has a slug starting with this prefix, so
 * teardown (and a later run, after a crash) can find and remove them.
 */
export const E2E_SLUG_PREFIX = 'e2e-smoke-'

/** Service-role client for the LOCAL stack only (throws otherwise). */
export function adminDb(): SupabaseClient {
  const { url, serviceRoleKey } = assertLocalSupabaseEnv(process.env)
  return createClient(url, serviceRoleKey.replace(/\s/g, ''), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export function adminCredentials(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('E2E admin credentials missing: e2e/global-setup.ts did not run')
  }
  return { email, password }
}

export function runId(): string {
  const id = process.env.E2E_RUN_ID
  if (!id) throw new Error('E2E_RUN_ID missing: e2e/global-setup.ts did not run')
  return id
}

export { getAllContentTypes, getContentType }

/**
 * Remove every row created by the suite (slug prefix), in every CMS table.
 * Junction rows go with them (ON DELETE CASCADE). Also removes the audit-log
 * rows the suite's deletes wrote.
 */
export async function deleteE2eContent(db: SupabaseClient): Promise<void> {
  for (const ct of getAllContentTypes()) {
    const { data, error } = await db
      .from(ct.tableName)
      .select('id')
      .like('slug', `${E2E_SLUG_PREFIX}%`)
    if (error) throw new Error(`cleanup: list ${ct.tableName}: ${error.message}`)
    const ids = (data ?? []).map(row => row.id as string)
    if (ids.length === 0) continue
    const { error: auditError } = await db.from('deletion_audit_log').delete().in('content_id', ids)
    if (auditError) throw new Error(`cleanup: audit log for ${ct.tableName}: ${auditError.message}`)
    const { error: deleteError } = await db.from(ct.tableName).delete().in('id', ids)
    if (deleteError) throw new Error(`cleanup: delete ${ct.tableName}: ${deleteError.message}`)
  }
}
