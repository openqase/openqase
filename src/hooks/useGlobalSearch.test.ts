import { describe, it, expect } from 'vitest'
import { shouldOpenResults } from './useGlobalSearch'

describe('shouldOpenResults', () => {
  it('ignores whitespace-only input', () => {
    expect(shouldOpenResults('  ')).toBe(false)
    expect(shouldOpenResults(' a ')).toBe(false)
    expect(shouldOpenResults(' ab')).toBe(true)
  })
})
