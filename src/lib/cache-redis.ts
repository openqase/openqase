/**
 * Production-ready Redis-based cache using Upstash
 * Supports multi-server deployments with consistent caching
 */

import { Redis } from '@upstash/redis';

/**
 * Redis-based cache for production use
 * Uses Upstash Redis for serverless-friendly caching
 */
export class RedisCache {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor() {
    // Initialize Redis if credentials are available
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.enabled = true;
        console.log('✅ Redis cache initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Redis cache:', error);
        this.enabled = false;
      }
    } else {
      console.log('ℹ️ Redis credentials not found, cache disabled');
    }
  }

  /**
   * Check if Redis caching is available
   */
  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Redis cache get failed:', error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache (must be JSON serializable)
   * @param ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Redis cache set failed:', error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis cache delete failed:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern - Key pattern (e.g., "user:*")
   * @returns Number of keys deleted
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0;
    }

    try {
      // Use SCAN to find keys matching pattern
      let cursor: number | string = 0;
      let deletedCount = 0;

      do {
        const result: [number | string, string[]] = await this.redis.scan(cursor, {
          match: pattern,
          count: 100,
        });

        const [newCursor, keys] = result;
        cursor = newCursor;

        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== 0 && cursor !== '0');

      return deletedCount;
    } catch (error) {
      console.error('Redis cache deletePattern failed:', error);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   */
  async has(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis cache has failed:', error);
      return false;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   * If key exists, return cached value. If not, call fetcher, cache result, and return.
   * @param key - Cache key
   * @param fetcher - Function to fetch data if not cached
   * @param ttlSeconds - Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    if (!this.enabled || !this.redis) {
      // If Redis not available, just fetch
      return fetcher();
    }

    try {
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
    } catch (error) {
      console.error('Redis cache getOrSet failed:', error);
      // Fallback to fetcher on error
      return fetcher();
    }
  }

  /**
   * Increment a counter
   * @param key - Cache key
   * @param amount - Amount to increment (default: 1)
   * @returns New value
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.incrby(key, amount);
      return value;
    } catch (error) {
      console.error('Redis cache increment failed:', error);
      return null;
    }
  }

  /**
   * Get time to live for a key
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const ttl = await this.redis.ttl(key);
      return ttl;
    } catch (error) {
      console.error('Redis cache ttl failed:', error);
      return null;
    }
  }

  /**
   * Set expiry on an existing key
   * @param key - Cache key
   * @param ttlSeconds - Time to live in seconds
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error('Redis cache expire failed:', error);
      return false;
    }
  }

  /**
   * Get multiple values at once
   * @param keys - Array of cache keys
   * @returns Array of values (null for missing keys)
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    if (!this.enabled || !this.redis || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      return values as (T | null)[];
    } catch (error) {
      console.error('Redis cache mget failed:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values at once
   * @param entries - Object with key-value pairs
   * @param ttlSeconds - Time to live in seconds (applied to all keys)
   */
  async mset(entries: Record<string, unknown>, ttlSeconds?: number): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      // Convert object to array format for mset
      const pairs: [string, unknown][] = Object.entries(entries);

      await this.redis.mset(Object.fromEntries(pairs));

      // Set TTL for each key if specified
      if (ttlSeconds) {
        await Promise.all(
          Object.keys(entries).map((key) => this.redis!.expire(key, ttlSeconds))
        );
      }

      return true;
    } catch (error) {
      console.error('Redis cache mset failed:', error);
      return false;
    }
  }

  /**
   * Flush all cache (use with caution!)
   * Only works in development mode
   */
  async flush(): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      console.error('Cache flush is disabled in production');
      return false;
    }

    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Redis cache flush failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const redisCache = new RedisCache();

/**
 * Common TTL values (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
  MONTH: 2592000,      // 30 days
} as const;

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  caseStudy: (slug: string) => `case-study:${slug}`,
  blogPost: (slug: string) => `blog-post:${slug}`,
  algorithm: (slug: string) => `algorithm:${slug}`,
  industry: (slug: string) => `industry:${slug}`,
  persona: (slug: string) => `persona:${slug}`,
  user: (id: string) => `user:${id}`,
  apiResponse: (endpoint: string, params?: string) =>
    params ? `api:${endpoint}:${params}` : `api:${endpoint}`,
};
