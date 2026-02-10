import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock cache-redis before importing cache
vi.mock('./cache-redis', () => ({
  redisCache: {
    isEnabled: vi.fn(() => false),
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    deletePattern: vi.fn(),
    has: vi.fn(),
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
    DAY: 86400,
    WEEK: 604800,
    MONTH: 2592000,
  },
  CacheKeys: {
    caseStudy: (slug: string) => `case-study:${slug}`,
    blogPost: (slug: string) => `blog-post:${slug}`,
    algorithm: (slug: string) => `algorithm:${slug}`,
    industry: (slug: string) => `industry:${slug}`,
    persona: (slug: string) => `persona:${slug}`,
    user: (id: string) => `user:${id}`,
    apiResponse: (endpoint: string, params?: string) =>
      params ? `api:${endpoint}:${params}` : `api:${endpoint}`,
  },
}))

// Import after mock is set up
import { cache, CACHE_TTL, CacheKeys } from './cache'

describe('InMemoryCache (via HybridCache with Redis disabled)', () => {
  beforeEach(() => {
    cache.clearMemory()
  })

  describe('get/set', () => {
    it('returns null for missing key', async () => {
      expect(await cache.get('nonexistent')).toBeNull()
    })

    it('stores and retrieves a value', async () => {
      await cache.set('key1', 'value1')
      expect(await cache.get('key1')).toBe('value1')
    })

    it('stores and retrieves objects', async () => {
      const obj = { name: 'test', count: 42 }
      await cache.set('obj', obj)
      expect(await cache.get('obj')).toEqual(obj)
    })

    it('stores and retrieves arrays', async () => {
      const arr = [1, 2, 3]
      await cache.set('arr', arr)
      expect(await cache.get('arr')).toEqual(arr)
    })

    it('overwrites existing values', async () => {
      await cache.set('key', 'first')
      await cache.set('key', 'second')
      expect(await cache.get('key')).toBe('second')
    })

    it('returns true from set', async () => {
      const result = await cache.set('key', 'value')
      expect(result).toBe(true)
    })
  })

  describe('TTL expiry', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns value before TTL expires', async () => {
      await cache.set('key', 'value', 10)
      vi.advanceTimersByTime(9000)
      expect(await cache.get('key')).toBe('value')
    })

    it('returns null after TTL expires', async () => {
      await cache.set('key', 'value', 1)
      vi.advanceTimersByTime(1001)
      expect(await cache.get('key')).toBeNull()
    })

    it('uses default TTL when not specified', async () => {
      await cache.set('key', 'value')
      // Default TTL is CACHE_TTL.LONG = 3600s
      vi.advanceTimersByTime(3600 * 1000 - 1)
      expect(await cache.get('key')).toBe('value')
      vi.advanceTimersByTime(2)
      expect(await cache.get('key')).toBeNull()
    })
  })

  describe('LRU eviction', () => {
    it('evicts oldest entry when max size reached', async () => {
      // The default maxSize is 1000, so we use the HybridCache which creates an InMemoryCache(1000)
      // We'll test by filling it up and checking stats
      for (let i = 0; i < 1000; i++) {
        await cache.set(`key-${i}`, `value-${i}`)
      }
      expect(cache.stats().memory.size).toBe(1000)

      // Adding one more should evict the oldest
      await cache.set('key-new', 'value-new')
      expect(cache.stats().memory.size).toBe(1000)
      // The oldest key (key-0) should be evicted
      expect(await cache.get('key-0')).toBeNull()
      // The new key should be present
      expect(await cache.get('key-new')).toBe('value-new')
    })
  })

  describe('deletePattern', () => {
    it('deletes keys matching a glob pattern', async () => {
      await cache.set('user:1', 'alice')
      await cache.set('user:2', 'bob')
      await cache.set('post:1', 'hello')

      const count = await cache.deletePattern('user:*')
      expect(count).toBe(2)
      expect(await cache.get('user:1')).toBeNull()
      expect(await cache.get('user:2')).toBeNull()
      expect(await cache.get('post:1')).toBe('hello')
    })

    it('returns 0 when no keys match', async () => {
      await cache.set('key1', 'value1')
      const count = await cache.deletePattern('nonexistent:*')
      expect(count).toBe(0)
    })

    it('deletes all keys with wildcard', async () => {
      await cache.set('a', 1)
      await cache.set('b', 2)
      const count = await cache.deletePattern('*')
      expect(count).toBe(2)
    })
  })

  describe('has', () => {
    it('returns false for missing key', async () => {
      expect(await cache.has('nope')).toBe(false)
    })

    it('returns true for existing key', async () => {
      await cache.set('exists', 'yes')
      expect(await cache.has('exists')).toBe(true)
    })

    it('returns false for expired key', async () => {
      vi.useFakeTimers()
      await cache.set('temp', 'value', 1)
      vi.advanceTimersByTime(1001)
      expect(await cache.has('temp')).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('clearMemory', () => {
    it('removes all entries', async () => {
      await cache.set('a', 1)
      await cache.set('b', 2)
      cache.clearMemory()
      expect(await cache.get('a')).toBeNull()
      expect(await cache.get('b')).toBeNull()
      expect(cache.stats().memory.size).toBe(0)
    })
  })

  describe('stats', () => {
    it('returns correct size', async () => {
      expect(cache.stats().memory.size).toBe(0)
      await cache.set('key', 'val')
      expect(cache.stats().memory.size).toBe(1)
    })

    it('reports redis as disabled', () => {
      expect(cache.stats().redis).toBe(false)
    })

    it('reports maxSize', () => {
      expect(cache.stats().memory.maxSize).toBe(1000)
    })
  })

  describe('getOrSet (cache-aside)', () => {
    it('calls fetcher on cache miss and caches result', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched')
      const result = await cache.getOrSet('miss', fetcher)
      expect(result).toBe('fetched')
      expect(fetcher).toHaveBeenCalledOnce()

      // Second call should use cache
      const result2 = await cache.getOrSet('miss', fetcher)
      expect(result2).toBe('fetched')
      expect(fetcher).toHaveBeenCalledOnce()
    })

    it('returns cached value without calling fetcher', async () => {
      await cache.set('hit', 'cached')
      const fetcher = vi.fn().mockResolvedValue('fetched')
      const result = await cache.getOrSet('hit', fetcher)
      expect(result).toBe('cached')
      expect(fetcher).not.toHaveBeenCalled()
    })
  })

  describe('wrap', () => {
    it('wraps a function with caching', async () => {
      const original = vi.fn().mockResolvedValue(42)
      const wrapped = cache.wrap(original, {
        keyGenerator: (x: number) => `fn:${x}`,
      })

      const r1 = await wrapped(5)
      expect(r1).toBe(42)
      expect(original).toHaveBeenCalledWith(5)

      const r2 = await wrapped(5)
      expect(r2).toBe(42)
      expect(original).toHaveBeenCalledOnce() // not called again
    })

    it('uses different cache keys for different args', async () => {
      let callCount = 0
      const original = vi.fn().mockImplementation(async (x: number) => {
        callCount++
        return x * 2
      })
      const wrapped = cache.wrap(original, {
        keyGenerator: (x: number) => `fn:${x}`,
      })

      expect(await wrapped(3)).toBe(6)
      expect(await wrapped(4)).toBe(8)
      expect(callCount).toBe(2)
    })
  })

  describe('delete', () => {
    it('deletes a cached key', async () => {
      await cache.set('del-me', 'value')
      await cache.delete('del-me')
      expect(await cache.get('del-me')).toBeNull()
    })
  })
})

describe('CACHE_TTL re-exports', () => {
  it('exports expected TTL constants', () => {
    expect(CACHE_TTL.SHORT).toBe(60)
    expect(CACHE_TTL.MEDIUM).toBe(300)
    expect(CACHE_TTL.LONG).toBe(3600)
    expect(CACHE_TTL.DAY).toBe(86400)
  })
})

describe('CacheKeys re-exports', () => {
  it('generates case study keys', () => {
    expect(CacheKeys.caseStudy('my-slug')).toBe('case-study:my-slug')
  })

  it('generates API response keys with and without params', () => {
    expect(CacheKeys.apiResponse('users')).toBe('api:users')
    expect(CacheKeys.apiResponse('users', 'page=1')).toBe('api:users:page=1')
  })
})
