// API utilities for request management and caching
import { performanceMonitor } from './performanceMonitor';

// Add trending products specific cache timeout - longer since trending changes less frequently
export const TRENDING_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

// Request deduplication cache
export const requestCache = new Map<string, PendingRequest>();

// Cache timeout (2 minutes for better performance)
export const CACHE_TIMEOUT = 2 * 60 * 1000;

/**
 * Deduplicates API requests by caching ongoing requests
 * and returning the same promise for identical requests
 */
export const deduplicateRequest = async <T>(
  url: string,
  fetchOptions?: RequestInit
): Promise<T> => {
  // Check if this is a cache-busting request
  const isCacheBusting = url.includes('_t=') || fetchOptions?.cache === 'no-store';
  
  const cacheKey = `${url}:${JSON.stringify(fetchOptions || {})}`;
  
  // Skip cache for cache-busting requests
  if (!isCacheBusting) {
    // Check if we have a pending request for this URL
    const cached = requestCache.get(cacheKey);
    if (cached) {
      // Check if cache is still valid
      if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        console.log(`⚡ Using cached request for: ${url}`);
        performanceMonitor.countRequest(`${url} (cached)`);
        return cached.promise;
      } else {
        // Remove expired cache entry
        requestCache.delete(cacheKey);
      }
    }
  }
  
  console.log(`🚀 Making ${isCacheBusting ? 'fresh' : 'new'} request to: ${url}`);
  performanceMonitor.countRequest(url);
  
  // Create new request with optimized headers
  const promise = fetch(url, {
    ...fetchOptions,
    headers: {
      ...(isCacheBusting ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      } : {
        'Cache-Control': 'max-age=60, stale-while-revalidate=30', // Reduced cache time for freshness
      }),
      'Accept': 'application/json',
      'Connection': 'keep-alive',
      ...fetchOptions?.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: Request failed`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Include additional details for debugging
        if (errorData.details) {
          console.error('API Error Details:', errorData.details);
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }).catch((error) => {
    // Enhanced error handling
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Please check your internet connection');
    }
    if (error.name === 'AbortError') {
      throw new Error('Request timed out: The server is taking too long to respond');
    }
    // Re-throw the original error if it's already a proper error
    throw error;
  }).finally(() => {
    // Remove from cache when request completes (only if it was cached)
    if (!isCacheBusting) {
      requestCache.delete(cacheKey);
    }
  });
  
  // Cache the promise only if not cache-busting
  if (!isCacheBusting) {
    requestCache.set(cacheKey, {
      promise,
      timestamp: Date.now(),
    });
  }
  
  console.log(`Making ${isCacheBusting ? 'fresh' : 'new'} request for: ${url}`);
  return promise;
};

/**
 * Builds a proper API URL with query parameters
 */
export const buildApiUrl = (
  endpoint: string,
  params: Record<string, string | number | boolean | null | undefined>
): string => {
  // Handle both server and client environments
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
  const url = new URL(endpoint, baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
};

/**
 * Fetches products with deduplication and proper error handling
 */
export const fetchProducts = async (filters: {
  category?: string;
  subCategory?: string;
  page?: number;
  limit?: number;
  q?: string;
  _t?: number; // Cache buster
}) => {
  const url = buildApiUrl('/api/products', filters);
  return deduplicateRequest(url);
};

/**
 * Fetches categories with deduplication
 */
export const fetchCategories = async () => {
  return deduplicateRequest('/api/categories');
};

/**
 * Fetches customer products with deduplication
 */
export const fetchCustomerProducts = async (filters: {
  category?: string;
  limit?: number;
}) => {
  const url = buildApiUrl('/api/customer/products', filters);
  return deduplicateRequest(url);
};

/**
 * Fetches trending products with deduplication and extended caching
 * Uses a longer cache timeout since trending products change less frequently
 */
export const fetchTrendingProducts = async () => {
  const url = '/api/customer/trending';
  const cacheKey = url;
  
  // Check for cached trending data with extended timeout
  const cached = requestCache.get(cacheKey);
  if (cached) {
    if (Date.now() - cached.timestamp < TRENDING_CACHE_TIMEOUT) {
      console.log(`⚡ Using cached trending data (extended timeout)`);
      performanceMonitor.countRequest(`${url} (cached trending)`);
      return cached.promise;
    } else {
      requestCache.delete(cacheKey);
    }
  }
  
  // Create new request with optimized headers for trending
  console.log(`🚀 Fetching fresh trending products data`);
  performanceMonitor.countRequest(url);
  
  const promise = fetch(url, {
    headers: {
      'Cache-Control': 'max-age=300, stale-while-revalidate=60',
      'Accept': 'application/json',
    },
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
  })
    .then(async (response) => {
      if (!response.ok) {
        // Log warning instead of throwing error for non-critical API
        console.warn(`Trending products API returned ${response.status}, returning fallback data`);
        return { products: [] }; // Return empty fallback instead of throwing
      }
      return response.json();
    })
    .catch((error) => {
      // Silent failure for trending products - not critical for app functionality
      console.warn('Trending products fetch warning (non-critical):', error.message);
      return { products: [] }; // Return empty array on error for graceful degradation
    });
  
  // Cache the promise with the extended timeout
  requestCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });
  
  return promise;
};

/**
 * Fetches user cart with deduplication
 */
export const fetchUserCart = async () => {
  return deduplicateRequest('/api/user/cart');
};

/**
 * Fetches user wishlist with deduplication
 */
export const fetchUserWishlist = async () => {
  return deduplicateRequest('/api/user/wishlist');
};

/**
 * Fetches auth user info with deduplication
 */
export const fetchAuthUser = async () => {
  return deduplicateRequest('/api/auth/me');
};

/**
 * Clear all cached requests (useful for force refresh)
 */
export const clearRequestCache = () => {
  requestCache.clear();
  console.log('Request cache cleared');
};

/**
 * Clears all cached requests that match a given pattern
 * Useful for cache invalidation after product operations
 */
export const invalidateCache = (pattern?: string) => {
  if (!pattern) {
    // Clear all cache
    requestCache.clear();
    console.log('🧹 Cleared all request cache');
    return;
  }
  
  const keysToDelete = Array.from(requestCache.keys()).filter(key => 
    key.includes(pattern)
  );
  
  keysToDelete.forEach(key => requestCache.delete(key));
  console.log(`🧹 Cleared ${keysToDelete.length} cached requests matching: ${pattern}`);
};

/**
 * Clear product-related caches
 */
export const invalidateProductCaches = () => {
  invalidateCache('/api/products');
  invalidateCache('/api/categories');
  invalidateCache('/api/search');
};
