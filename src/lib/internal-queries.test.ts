import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { fromTable } from './internal-queries';

function makeMockClient() {
  const mockBuilder = { select: vi.fn(), eq: vi.fn(), is: vi.fn() };
  const mockClient = {
    from: vi.fn().mockReturnValue(mockBuilder),
  } as unknown as SupabaseClient<Database>;
  return { mockClient, mockBuilder };
}

describe('fromTable', () => {
  it('accepts content tables', () => {
    const { mockClient, mockBuilder } = makeMockClient();
    const builder = fromTable(mockClient, 'case_studies');
    expect(builder).toBeDefined();
    expect(typeof builder.select).toBe('function');
    expect((mockClient as any).from).toHaveBeenCalledWith('case_studies');
  });

  it('accepts junction tables', () => {
    const { mockClient } = makeMockClient();
    const builder = fromTable(mockClient, 'algorithm_case_study_relations');
    expect(builder).toBeDefined();
    expect((mockClient as any).from).toHaveBeenCalledWith('algorithm_case_study_relations');
  });

  it('accepts lookup tables (user_preferences)', () => {
    const { mockClient } = makeMockClient();
    const builder = fromTable(mockClient, 'user_preferences');
    expect(builder).toBeDefined();
    expect((mockClient as any).from).toHaveBeenCalledWith('user_preferences');
  });
});
