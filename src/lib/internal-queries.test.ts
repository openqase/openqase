import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fromTable } from './internal-queries';

function makeMockClient() {
  const mockBuilder = { select: vi.fn(), eq: vi.fn(), is: vi.fn() };
  const mockFrom = vi.fn().mockReturnValue(mockBuilder);
  const mockClient = {
    from: mockFrom,
  } as unknown as SupabaseClient<Database>;
  return { mockClient, mockFrom, mockBuilder };
}

describe('fromTable', () => {
  it('accepts content tables', () => {
    const { mockClient, mockFrom } = makeMockClient();
    const builder = fromTable(mockClient, 'case_studies');
    expect(builder).toBeDefined();
    expect(typeof builder.select).toBe('function');
    expect(mockFrom).toHaveBeenCalledWith('case_studies');
  });

  it('accepts junction tables', () => {
    const { mockClient, mockFrom } = makeMockClient();
    const builder = fromTable(mockClient, 'algorithm_case_study_relations');
    expect(builder).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('algorithm_case_study_relations');
  });

  it('accepts lookup tables (user_preferences)', () => {
    const { mockClient, mockFrom } = makeMockClient();
    const builder = fromTable(mockClient, 'user_preferences');
    expect(builder).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('user_preferences');
  });
});
