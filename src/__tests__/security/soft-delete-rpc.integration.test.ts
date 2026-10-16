/**
 * The soft-delete RPCs are SECURITY DEFINER and must not be callable with the
 * public anon key (migration 20260923152216 revokes EXECUTE from anon and
 * authenticated). Runs against the seeded local Supabase via
 * `npm run test:integration`; see src/cms/integration-env.ts.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { assertLocalSupabaseEnv } from '@/cms/integration-env'

// Published case study from supabase/seed.sql.
const SEEDED_CASE_STUDY_ID = '55555555-0000-0000-0000-000000000001'

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

let anon: SupabaseClient
let service: SupabaseClient

describe('soft_delete_content / recover_content are not executable by anon', () => {
  beforeAll(() => {
    const { url, anonKey, serviceRoleKey } = assertLocalSupabaseEnv(process.env)
    anon = createClient(url, anonKey, clientOptions)
    service = createClient(url, serviceRoleKey, clientOptions)
  })

  async function caseStudyState() {
    const { data, error } = await service
      .from('case_studies')
      .select('published, deleted_at')
      .eq('id', SEEDED_CASE_STUDY_ID)
      .single()
    expect(error).toBeNull()
    return data
  }

  it('anon cannot call soft_delete_content', async () => {
    expect(await caseStudyState()).toEqual({ published: true, deleted_at: null })

    const { data, error } = await anon.rpc('soft_delete_content', {
      table_name: 'case_studies',
      content_id: SEEDED_CASE_STUDY_ID,
    })

    expect(data).toBeNull()
    // EXECUTE is revoked, so PostgREST rejects the call before the function's
    // own caller check runs (which would also raise 42501, "Not authorized").
    expect(error?.code).toBe('42501')
    expect(error?.message).toBe('permission denied for function soft_delete_content')
    expect(await caseStudyState()).toEqual({ published: true, deleted_at: null })
  })

  it('anon cannot call recover_content', async () => {
    const { data, error } = await anon.rpc('recover_content', {
      table_name: 'case_studies',
      content_id: SEEDED_CASE_STUDY_ID,
    })

    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
    expect(error?.message).toBe('permission denied for function recover_content')
  })
})
