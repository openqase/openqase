import { describe, it, expect } from 'vitest'
import { getContentType, getAllContentTypes, getContentTypeByTableName } from './registry'

describe('registry', () => {
  it('looks up content type by slug', () => {
    const ct = getContentType('industries')
    expect(ct).toBeDefined()
    expect(ct!.tableName).toBe('industries')
  })

  it('returns undefined for unknown slug', () => {
    expect(getContentType('nonexistent')).toBeUndefined()
  })

  it('looks up by table name', () => {
    const ct = getContentTypeByTableName('industries')
    expect(ct).toBeDefined()
    expect(ct!.slug).toBe('industries')
  })

  it('returns all registered content types', () => {
    const all = getAllContentTypes()
    expect(all.length).toBeGreaterThanOrEqual(1)
    expect(all.some(ct => ct.slug === 'industries')).toBe(true)
  })
})
