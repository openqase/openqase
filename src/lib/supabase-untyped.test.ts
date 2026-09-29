import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable } from './supabase-untyped'

describe('fromTable', () => {
  it('delegates to client.from() with the given table name', () => {
    const mockReturn = { select: vi.fn() }
    const mockClient = { from: vi.fn().mockReturnValue(mockReturn) }

    const result = fromTable(mockClient as unknown as SupabaseClient, 'algorithm_case_study_relations')

    expect(mockClient.from).toHaveBeenCalledWith('algorithm_case_study_relations')
    expect(result).toBe(mockReturn)
  })

  it('works with any table name string', () => {
    const mockReturn = { select: vi.fn() }
    const mockClient = { from: vi.fn().mockReturnValue(mockReturn) }

    fromTable(mockClient as unknown as SupabaseClient, 'case_study_industry_relations')

    expect(mockClient.from).toHaveBeenCalledWith('case_study_industry_relations')
  })
})
