// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'
// Auth config removed - content is now free to access

const protectedRoutes = [
  '/paths',
  '/case-study',
  '/profile'
]

const adminRoutes = [
  '/admin'
]

export async function middleware(req: NextRequest) {
  // First, update the session using the new SSR package
  const res = await updateSession(req)
  
  // Get the URL from the response or create a new one
  const url = res.url ? new URL(res.url) : new URL(req.url)
  
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isAuthCallback = req.nextUrl.pathname === '/auth/callback'
  const isAdminRoute = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const authRequired = false // Content is now free to access
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')

  // Handle auth callback - must come first
  if (isAuthCallback) {
    return res
  }

  // Handle API routes
  if (isApiRoute) {
    // Define public API routes that don't need authentication
    const publicApiRoutes = [
      '/api/newsletter'
    ]
    
    const isPublicApiRoute = publicApiRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )
    
    // If it's a public API route, allow it through
    if (isPublicApiRoute) {
      return res
    }
    
    // For non-public API routes, check authentication
    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    const supabase = await createServerSupabaseClient()
    
    // Get the user (more secure than getSession)
    const { data: { user } } = await supabase.auth.getUser()
    
    // For GET requests, allow access without authentication for now
    // (This maintains current behavior while we add protection incrementally)
    if (req.method === 'GET') {
      return res
    }
    
    // For write operations (POST, PUT, PATCH, DELETE), require authentication + Origin check
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      // CSRF protection: verify Origin header matches the site
      const origin = req.headers.get('origin')
      const host = req.headers.get('host')
      if (origin && host) {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          )
        }
      } else if (!origin || !host) {
        // Block requests with no Origin header for state-changing methods
        // (legitimate browser requests always include Origin for cross-origin and same-origin POST)
        // Also block if Host is missing (defensive — should never happen in practice)
        return NextResponse.json(
          { error: 'Missing origin header' },
          { status: 403 }
        )
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        )
      }
      
      // Check if user has admin role for write operations
      const { data: userPreferences } = await supabase
        .from('user_preferences')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userPreferences || userPreferences.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' }, 
          { status: 403 }
        )
      }
    }
    
    return res
  }

  // Get user session for auth checks
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For admin routes, check if user has admin role
  if (isAdminRoute) {
    // Dev-only bypass. Three layers of safety:
    //   1) NODE_ENV must be development (build-time fail in prod via prebuild)
    //   2) DEV_MODE_AUTH_BYPASS must be exactly 'true'
    //   3) Host must exactly match localhost / 127.0.0.1 (no substring tricks)
    const host = req.headers.get('host');
    const devMode =
      process.env.NODE_ENV === 'development' &&
      process.env.DEV_MODE_AUTH_BYPASS === 'true' &&
      (host === 'localhost' ||
       host === 'localhost:3000' ||
       host === '127.0.0.1' ||
       host === '127.0.0.1:3000');

    if (devMode) {
      return res
    }

    if (!user) {
      return NextResponse.redirect(new URL('/auth?redirectTo=/admin', req.url))
    }

    // Check if user is admin
    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userPreferences || userPreferences.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // For content routes, only require auth if feature flag is enabled
  if (isProtectedRoute && authRequired && !user) {
    return NextResponse.redirect(new URL('/auth?redirectTo=' + req.nextUrl.pathname, req.url))
  }

  return res
}

// Run middleware on auth routes and protected routes
export const config = {
  matcher: [
    '/auth/:path*',
    '/admin/:path*',
    '/profile',
    '/api/:path*',
    // Note: Removed /paths/:path* and /case-study/:path* to allow static generation
    // These pages will implement auth checks at the component level when needed
  ]
}