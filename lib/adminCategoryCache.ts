// Simple in-memory cache for admin category data
import { logCachePerformance } from '@/lib/serverPerformanceLogger';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class AdminCategoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    });
    logCachePerformance('SET', true, key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      logCachePerformance('GET', false, key);
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      logCachePerformance('GET', false, `${key} (expired)`);
      return null;
    }

    logCachePerformance('GET', true, key);
    return entry.data as T;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          logCachePerformance('INVALIDATE', false, key);
        }
      }
    } else {
      this.cache.clear();
      logCachePerformance('INVALIDATE', false, 'all');
    }
  }

  // Check if data is stale but still available (for stale-while-revalidate)
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() > entry.expires;
  }
}

export const adminCategoryCache = new AdminCategoryCache();
