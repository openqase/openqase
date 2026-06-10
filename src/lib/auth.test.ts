import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAdmin } from './auth';

// ---------------------------------------------------------------------------
// Boundary mock: intercept at the Supabase client so the real requireAdmin()
// runs end-to-end. Tests verify the security gate's actual behaviour, not
// spy-call bookkeeping.
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockSingle = vi.fn();

// Build a chainable query stub that resolves with mockSingle at the end of the
// .from().select().eq().single() chain.
function makeQueryChain() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: () => mockSingle(),
  };
  return chain;
}

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (_table: string) => makeQueryChain(),
  })),
}));

// Helper — configure the two mock layers for a given scenario.
function setupMocks({
  user,
  role,
}: {
  user: { id: string; email: string } | null;
  role?: string;
}) {
  mockGetUser.mockResolvedValue({ data: { user } });
  if (user !== null) {
    mockSingle.mockResolvedValue({ data: role !== undefined ? { role } : null });
  }
}

describe('withAdmin — boundary-mocked auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws "Unauthorized: not signed in" when there is no active session', async () => {
    setupMocks({ user: null });
    const inner = vi.fn(async () => 'should not run');

    const wrapped = withAdmin(inner);

    await expect(wrapped()).rejects.toThrow('Unauthorized: not signed in');
    expect(inner).not.toHaveBeenCalled();
  });

  it('throws "Forbidden: admin role required" when the user is not an admin', async () => {
    setupMocks({ user: { id: 'u1', email: 'user@example.com' }, role: 'viewer' });
    const inner = vi.fn(async () => 'should not run');

    const wrapped = withAdmin(inner);

    await expect(wrapped()).rejects.toThrow('Forbidden: admin role required');
    expect(inner).not.toHaveBeenCalled();
  });

  it('delegates to the inner action and returns its result when the user is an admin', async () => {
    setupMocks({ user: { id: 'u1', email: 'admin@example.com' }, role: 'admin' });
    const inner = vi.fn(async (n: number) => n + 1);

    const wrapped = withAdmin(inner);
    const result = await wrapped(41);

    expect(result).toBe(42);
    expect(inner).toHaveBeenCalledWith(41);
  });

  it('passes through multiple arguments and preserves the return type for admin users', async () => {
    setupMocks({ user: { id: 'u2', email: 'admin@example.com' }, role: 'admin' });
    const inner = vi.fn(async (a: string, b: string) => `${a}-${b}`);

    const wrapped = withAdmin(inner);
    const result = await wrapped('foo', 'bar');

    expect(result).toBe('foo-bar');
    expect(inner).toHaveBeenCalledWith('foo', 'bar');
  });
});
