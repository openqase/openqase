import { randomBytes, randomUUID } from 'node:crypto'
import type { FullConfig } from '@playwright/test'
import { adminDb, deleteE2eContent } from './support'

/**
 * Creates a throwaway admin user in the LOCAL Supabase (the service-role
 * client refuses any non-local URL), and returns the teardown that deletes it
 * again along with everything the suite created.
 *
 * Admin = a confirmed auth user plus user_preferences.role = 'admin', which
 * is what src/proxy.ts and requireAdmin() (src/lib/auth.ts) check. The
 * password is random per run and never written to disk; tests read it from
 * the environment, which Playwright workers inherit from this process.
 */
export default async function globalSetup(_config: FullConfig) {
  const db = adminDb()

  // Leftovers from a run that crashed before teardown.
  await deleteE2eContent(db)

  const run = randomUUID().slice(0, 8)
  const email = `e2e-admin-${run}@openqase.test`
  const password = `E2e-${randomBytes(18).toString('base64url')}-9a`

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`e2e: could not create admin user: ${error?.message}`)
  const userId = data.user.id

  const { error: roleError } = await db.from('user_preferences').insert({ id: userId, role: 'admin' })
  if (roleError) {
    await db.auth.admin.deleteUser(userId)
    throw new Error(`e2e: could not grant admin role: ${roleError.message}`)
  }

  process.env.E2E_ADMIN_EMAIL = email
  process.env.E2E_ADMIN_PASSWORD = password
  process.env.E2E_RUN_ID = run

  return async () => {
    const errors: string[] = []
    try {
      await deleteE2eContent(db)
    } catch (err) {
      errors.push(String(err))
    }
    // deletion_audit_log.performed_by is NOT NULL but its FK to auth.users is
    // ON DELETE SET NULL, so the user cannot be deleted while it has audit rows.
    const steps: Array<[string, () => PromiseLike<{ error: { message: string } | null }>]> = [
      ['audit log', () => db.from('deletion_audit_log').delete().eq('performed_by', userId)],
      ['user_preferences', () => db.from('user_preferences').delete().eq('id', userId)],
      ['auth user', () => db.auth.admin.deleteUser(userId)],
    ]
    for (const [label, step] of steps) {
      const { error: stepError } = await step()
      if (stepError) errors.push(`${label}: ${stepError.message}`)
    }
    if (errors.length > 0) throw new Error(`e2e teardown failed:\n${errors.join('\n')}`)
  }
}
