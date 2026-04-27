import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
// Self-import so that vi.spyOn(authModule, 'requireAdmin') in tests can
// intercept the call made inside withAdmin(). In Vitest's module system the
// exports object is shared, so the spy replacement is visible here at
// invocation time.
import * as authSelf from './auth'

/**
 * Verify that the current request is from an authenticated admin user.
 * Provides defense-in-depth beyond middleware checks.
 *
 * Returns the authenticated user on success, or a NextResponse error on failure.
 */
export async function requireAdmin(): Promise<
  { user: { id: string; email?: string }; error: null } |
  { user: null; error: NextResponse }
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  const { data: userPreferences } = await supabase
    .from('user_preferences')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userPreferences || userPreferences.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
  }

  return { user: { id: user.id, email: user.email }, error: null }
}

/**
 * Higher-order wrapper for server actions.
 *
 * INVARIANT: every export under src/app/admin/.../actions.ts must be wrapped
 * in withAdmin(). Enforced by an ESLint no-restricted-syntax rule.
 *
 * Throws on auth failure. Server actions can throw — Next.js will surface
 * the error to the client. We do not return the NextResponse from
 * requireAdmin() here because server actions are not HTTP handlers.
 *
 * This is defense-in-depth (Tier 2 finding 1.3): the middleware already
 * blocks unauthorised access in the default path. withAdmin closes the gap
 * for misconfigurations or future routing changes.
 *
 * NOTE: calls requireAdmin via the module namespace object (authSelf) so that
 * vi.spyOn(authModule, 'requireAdmin') in tests can intercept the call.
 */
export function withAdmin<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const auth = await authSelf.requireAdmin();
    if (auth.error) {
      throw new Error('Unauthorized: admin access required');
    }
    return action(...args);
  };
}
