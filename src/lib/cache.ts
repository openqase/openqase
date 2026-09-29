/**
 * Hybrid cache with Redis support for production
 * Falls back to in-memory LRU cache for development
 */

import { redisCache, CACHE_TTL, CacheKeys } from './cache-redis';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Simple in-memory LRU cache for development
 */
class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: unknown, ttlSeconds: number = 3600): boolean {
    // Enforce size limit (LRU eviction)
    if (this.store.size >= this.maxSize) {
      // Delete oldest entry (first in map)
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });

    return true;
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete keys matching a pattern
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Hybrid cache that uses Redis when available, falls back to in-memory
 */
class HybridCache {
  private memory = new InMemoryCache();

  /**
   * Get a value from cache (tries Redis first, falls back to in-memory)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first if available
    if (redisCache.isEnabled()) {
      try {
        const value = await redisCache.get<T>(key);
        if (value !== null) {
          return value;
        }
      } catch (error) {
        console.warn('Redis cache get failed, using in-memory:', error);
      }
    }

    // Fall back to in-memory cache
    return this.memory.get<T>(key);
  }

  /**
   * Set a value in cache (writes to both Redis and in-memory)
   */
  async set(key: string, value: unknown, ttlSeconds: number = CACHE_TTL.LONG): Promise<boolean> {
    let success = false;

    // Try Redis if available
    if (redisCache.isEnabled()) {
      try {
        success = await redisCache.set(key, value, ttlSeconds);
      } catch (error) {
        console.warn('Redis cache set failed, using in-memory only:', error);
      }
    }

    // Always write to in-memory cache as well
    this.memory.set(key, value, ttlSeconds);

    return success || true; // Return true if at least in-memory succeeded
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    let success = false;

    if (redisCache.isEnabled()) {
      try {
        success = await redisCache.delete(key);
      } catch (error) {
        console.warn('Redis cache delete failed:', error);
      }
    }

    this.memory.delete(key);
    return success;
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    let count = 0;

    if (redisCache.isEnabled()) {
      try {
        count = await redisCache.deletePattern(pattern);
      } catch (error) {
        console.warn('Redis cache deletePattern failed:', error);
      }
    }

    const memoryCount = this.memory.deletePattern(pattern);
    return Math.max(count, memoryCount);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (redisCache.isEnabled()) {
      try {
        return await redisCache.has(key);
      } catch (error) {
        console.warn('Redis cache has failed:', error);
      }
    }

    return this.memory.has(key);
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.LONG
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch the data
    const data = await fetcher();

    // Cache the result (fire and forget)
    this.set(key, data, ttlSeconds).catch((error) => {
      console.error('Failed to cache result:', error);
    });

    return data;
  }

  /**
   * Wrap a function with caching
   * Returns a cached version of the function
   */
  wrap<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: {
      keyGenerator: (...args: TArgs) => string;
      ttl?: number;
    }
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = options.keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options.ttl);
    };
  }

  /**
   * Clear in-memory cache (for testing)
   */
  clearMemory(): void {
    this.memory.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      redis: redisCache.isEnabled(),
      memory: this.memory.stats(),
    };
  }
}

// Singleton instance
export const cache = new HybridCache();

// Re-export common utilities
export { CACHE_TTL, CacheKeys };
