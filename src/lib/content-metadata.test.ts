import { describe, it, expect, vi } from 'vitest'
import { getContentMetadata } from './content-metadata'

describe('getContentMetadata', () => {
  describe('case-studies', () => {
    it('returns year in list view', () => {
      const item = { year: 2025 }
      const result = getContentMetadata('case-studies', item, 'list')
      expect(result).toEqual([2025])
    })

    it('returns empty for grid view', () => {
      const item = { year: 2025 }
      const result = getContentMetadata('case-studies', item, 'grid')
      expect(result).toEqual([])
    })

    it('filters out null year', () => {
      const item = { year: null }
      const result = getContentMetadata('case-studies', item, 'list')
      expect(result).toEqual([])
    })
  })

  describe('algorithms', () => {
    it('returns formatted date in list view', () => {
      const item = { updated_at: '2025-06-15T00:00:00Z' }
      const result = getContentMetadata('algorithms', item, 'list')
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('2025')
    })

    it('returns empty for null updated_at', () => {
      const item = { updated_at: null }
      const result = getContentMetadata('algorithms', item, 'list')
      expect(result).toEqual([])
    })
  })

  describe('industries', () => {
    it('returns formatted date in list view', () => {
      const item = { updated_at: '2025-03-10T00:00:00Z' }
      const result = getContentMetadata('industries', item, 'list')
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('2025')
    })
  })

  describe('personas', () => {
    it('returns formatted date in list view', () => {
      const item = { updated_at: '2025-08-20T00:00:00Z' }
      const result = getContentMetadata('personas', item, 'list')
      expect(result).toHaveLength(1)
      expect(result[0]).toContain('2025')
    })
  })

  describe('grid view', () => {
    it('returns empty array for all content types', () => {
      expect(getContentMetadata('case-studies', { year: 2025 }, 'grid')).toEqual([])
      expect(getContentMetadata('algorithms', { updated_at: '2025-01-01' }, 'grid')).toEqual([])
      expect(getContentMetadata('industries', { updated_at: '2025-01-01' }, 'grid')).toEqual([])
      expect(getContentMetadata('personas', { updated_at: '2025-01-01' }, 'grid')).toEqual([])
    })
  })

  describe('error handling', () => {
    it('warns and returns empty for unknown content type', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = getContentMetadata('unknown-type' as any, {}, 'list')
      expect(result).toEqual([])
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
