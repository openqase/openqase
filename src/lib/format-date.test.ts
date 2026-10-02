import { describe, it, expect } from 'vitest'
import { formatPublishedDate } from './format-date'

describe('formatPublishedDate', () => {
  it('formats an ISO timestamp with the default en-GB numeric style', () => {
    expect(formatPublishedDate('2026-03-05T10:00:00Z')).toBe('05/03/2026')
  })

  it('returns null for null, undefined and empty string instead of the Unix epoch', () => {
    expect(formatPublishedDate(null)).toBeNull()
    expect(formatPublishedDate(undefined)).toBeNull()
    expect(formatPublishedDate('')).toBeNull()
  })

  it('returns null for an unparseable value', () => {
    expect(formatPublishedDate('not-a-date')).toBeNull()
  })

  it('accepts a locale and options', () => {
    expect(formatPublishedDate('2026-03-05T10:00:00Z', 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })).toBe('Mar 5, 2026')
  })
})
