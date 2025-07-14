/**
 * In-memory cache for trending products to reduce database load
 */

// Cache data structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache settings
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let trendingCache: CacheEntry<any> | null = null;

/**
 * Get trending products from cache if available and not expired
 */
export const getTrendingFromCache = (): any | null => {
  if (!trendingCache) return null;
  
  const now = Date.now();
  const isExpired = now - trendingCache.timestamp > CACHE_DURATION;
  
  if (isExpired) {
    trendingCache = null;
    return null;
  }
  
  return trendingCache.data;
};

/**
 * Store trending products in cache
 */
export const setTrendingCache = (data: any): void => {
  trendingCache = {
    data,
    timestamp: Date.now()
  };
  console.log('Trending products cached at:', new Date().toISOString());
};

/**
 * Clear trending cache
 */
export const clearTrendingCache = (): void => {
  trendingCache = null;
  console.log('Trending cache cleared at:', new Date().toISOString());
};
