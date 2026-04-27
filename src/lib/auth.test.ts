import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAdmin } from './auth';
import * as authModule from './auth';

describe('withAdmin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls requireAdmin before delegating to the action', async () => {
    const requireAdminSpy = vi
      .spyOn(authModule, 'requireAdmin')
      .mockResolvedValue({ user: { id: 'u1' }, error: null });
    const inner = vi.fn(async (n: number) => n + 1);

    const wrapped = withAdmin(inner);
    const result = await wrapped(41);

    expect(requireAdminSpy).toHaveBeenCalledOnce();
    expect(inner).toHaveBeenCalledWith(41);
    expect(result).toBe(42);
  });

  it('throws if requireAdmin returns an error result', async () => {
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue({
      user: null,
      error: new Response('unauthorized', { status: 401 }) as never,
    });
    const inner = vi.fn(async () => 'should not run');

    const wrapped = withAdmin(inner);

    await expect(wrapped()).rejects.toThrow(/admin/i);
    expect(inner).not.toHaveBeenCalled();
  });

  it('passes through multiple arguments and the return type', async () => {
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue({
      user: { id: 'u1' }, error: null,
    });
    const inner = vi.fn(async (a: string, b: string) => `${a}-${b}`);

    const wrapped = withAdmin(inner);
    const result = await wrapped('foo', 'bar');

    expect(result).toBe('foo-bar');
  });
});
