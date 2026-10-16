import { describe, it, expect } from 'vitest'
import { assertLocalSupabaseEnv } from './integration-env'

const keys = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
}

describe('assertLocalSupabaseEnv', () => {
  it.each(['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321'])(
    'accepts local URL %s',
    (url) => {
      expect(assertLocalSupabaseEnv({ ...keys, NEXT_PUBLIC_SUPABASE_URL: url })).toEqual({
        url,
        anonKey: 'anon',
        serviceRoleKey: 'service',
      })
    }
  )

  it.each([
    'https://abcdefgh.supabase.co',
    'http://127.0.0.1.example.com:54321',
    'http://localhost.example.com',
    'http://10.0.0.5:54321',
    'postgres://127.0.0.1:54322',
  ])('refuses non-local URL %s', (url) => {
    expect(() => assertLocalSupabaseEnv({ ...keys, NEXT_PUBLIC_SUPABASE_URL: url })).toThrow(/refuse|not a valid URL/)
  })

  it('requires every variable explicitly', () => {
    expect(() => assertLocalSupabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY/
    )
    expect(() => assertLocalSupabaseEnv({ ...keys, NEXT_PUBLIC_SUPABASE_URL: '  ' })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('rejects a malformed URL', () => {
    expect(() => assertLocalSupabaseEnv({ ...keys, NEXT_PUBLIC_SUPABASE_URL: 'not a url' })).toThrow(/not a valid URL/)
  })
})
