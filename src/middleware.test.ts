import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock updateSession to return a basic NextResponse
vi.mock('@/lib/supabase-middleware', () => ({
  updateSession: vi.fn(async (req: NextRequest) => {
    return new Response(null, { status: 200 })
  }),
}))

// Track what the mock supabase client returns
let mockUser: { id: string } | null = null
let mockRole: string | null = null

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUser },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: mockRole ? { role: mockRole } : null,
          })),
        })),
      })),
    })),
  })),
}))

function makeRequest(
  path: string,
  method = 'GET',
  headers: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost:3000${path}`
  return new NextRequest(url, {
    method,
    headers: {
      host: 'localhost:3000',
      ...headers,
    },
  })
}

// Import middleware after mocks are set up
const { middleware } = await import('./middleware')

beforeEach(() => {
  mockUser = null
  mockRole = null
  vi.clearAllMocks()
})

describe('middleware - public routes', () => {
  it('allows GET to /api/newsletter without auth', async () => {
    const res = await middleware(makeRequest('/api/newsletter'))
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it('allows GET to /api/case-studies without auth', async () => {
    const res = await middleware(makeRequest('/api/case-studies'))
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it('passes through auth callback', async () => {
    const res = await middleware(makeRequest('/auth/callback'))
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })
})

describe('middleware - CSRF Origin checking', () => {
  it('rejects POST with no Origin header', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'admin'
    const res = await middleware(makeRequest('/api/case-studies', 'POST'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Missing origin header')
  })

  it('rejects POST with mismatched Origin', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'admin'
    const res = await middleware(
      makeRequest('/api/case-studies', 'POST', {
        origin: 'https://evil.com',
      })
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Invalid origin')
  })

  it('allows POST with matching Origin + admin auth', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'admin'
    const res = await middleware(
      makeRequest('/api/case-studies', 'POST', {
        origin: 'http://localhost:3000',
      })
    )
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it('rejects DELETE with no Origin header', async () => {
    const res = await middleware(makeRequest('/api/case-studies', 'DELETE'))
    expect(res.status).toBe(403)
  })

  it('rejects PUT with mismatched Origin', async () => {
    const res = await middleware(
      makeRequest('/api/case-studies', 'PUT', {
        origin: 'https://attacker.com',
      })
    )
    expect(res.status).toBe(403)
  })
})

describe('middleware - API auth', () => {
  it('rejects POST with valid Origin but no user', async () => {
    mockUser = null
    const res = await middleware(
      makeRequest('/api/case-studies', 'POST', {
        origin: 'http://localhost:3000',
      })
    )
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Authentication required')
  })

  it('rejects POST with valid Origin and user but no admin role', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'viewer'
    const res = await middleware(
      makeRequest('/api/case-studies', 'POST', {
        origin: 'http://localhost:3000',
      })
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Admin access required')
  })
})

describe('middleware - admin routes', () => {
  it('redirects unauthenticated users to /auth', async () => {
    mockUser = null
    const res = await middleware(makeRequest('/admin/case-studies'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth?redirectTo=/admin')
  })

  it('redirects non-admin users to /', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'viewer'
    const res = await middleware(makeRequest('/admin/case-studies'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/')
  })

  it('allows admin users through', async () => {
    mockUser = { id: 'user-1' }
    mockRole = 'admin'
    const res = await middleware(makeRequest('/admin/case-studies'))
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })

  it('allows dev mode bypass on localhost', async () => {
    process.env.DEV_MODE_AUTH_BYPASS = 'true'
    mockUser = null
    const res = await middleware(makeRequest('/admin/case-studies'))
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(401)
    delete process.env.DEV_MODE_AUTH_BYPASS
  })

  it('does not bypass dev mode on non-localhost', async () => {
    process.env.DEV_MODE_AUTH_BYPASS = 'true'
    mockUser = null
    const req = new NextRequest('https://openqase.com/admin/case-studies', {
      method: 'GET',
      headers: { host: 'openqase.com' },
    })
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth')
    delete process.env.DEV_MODE_AUTH_BYPASS
  })
})
