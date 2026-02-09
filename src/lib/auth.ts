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
