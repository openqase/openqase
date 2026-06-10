import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
 * Do NOT use this wrapper in API route handlers (src/app/api/...) — those
 * should call requireAdmin() directly and return auth.error as the response.
 *
 * This is defense-in-depth (Tier 2 finding 1.3): the middleware already
 * blocks unauthorised access in the default path. withAdmin closes the gap
 * for misconfigurations or future routing changes.
 */
export function withAdmin<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const auth = await requireAdmin();
    if (auth.error) {
      const status = (auth.error as Response).status;
      throw new Error(
        status === 401
          ? 'Unauthorized: not signed in'
          : 'Forbidden: admin role required'
      );
    }
    return action(...args);
  };
}
