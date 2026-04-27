import { describe, it, expect, vi } from 'vitest';
import { publicQuery, getPublishedBySlug } from './public-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function makeMockClient() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, unknown> = {};
  const recorder = (method: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    });
  builder.select = recorder('select');
  builder.eq = recorder('eq');
  builder.is = recorder('is');
  builder.maybeSingle = recorder('maybeSingle');
  builder.from = recorder('from');
  const client = { from: builder.from } as unknown as SupabaseClient<Database>;
  return { client, calls, builder };
}

describe('publicQuery', () => {
  it('chains .eq("published", true) on a content table', () => {
    const { client, calls } = makeMockClient();
    publicQuery(client, 'case_studies');
    expect(calls).toContainEqual({ method: 'from', args: ['case_studies'] });
    expect(calls).toContainEqual({ method: 'eq', args: ['published', true] });
  });

  it('chains .is("deleted_at", null) on a content table', () => {
    const { client, calls } = makeMockClient();
    publicQuery(client, 'case_studies');
    expect(calls).toContainEqual({ method: 'is', args: ['deleted_at', null] });
  });

  it('returns a builder that supports further chaining (.select, .eq, .order)', () => {
    const { client, builder } = makeMockClient();
    const result = publicQuery(client, 'case_studies');
    expect(result).toBe(builder);
    expect(typeof result.select).toBe('function');
    expect(typeof result.eq).toBe('function');
  });
});

describe('getPublishedBySlug', () => {
  it('chains .eq("slug", slug) and .maybeSingle()', async () => {
    const { client, calls, builder } = makeMockClient();
    builder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    await getPublishedBySlug(client, 'case_studies', 'foo-slug');
    expect(calls).toContainEqual({ method: 'eq', args: ['slug', 'foo-slug'] });
  });

  it('also applies the published + deleted_at filters', async () => {
    const { client, calls, builder } = makeMockClient();
    builder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    await getPublishedBySlug(client, 'algorithms', 'bar');
    expect(calls).toContainEqual({ method: 'eq', args: ['published', true] });
    expect(calls).toContainEqual({ method: 'is', args: ['deleted_at', null] });
  });
});
