import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSafeRedirectPath } from '@/lib/redirect-utils'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Validate and sanitize the redirect URL to prevent open redirect attacks
  const safeRedirect = getSafeRedirectPath(redirectTo)

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin))
}