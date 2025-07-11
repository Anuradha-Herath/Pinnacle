// API utilities for request management and caching
import { performanceMonitor } from './performanceMonitor';

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
  const cacheKey = `${url}:${JSON.stringify(fetchOptions || {})}`;
  
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
  
  console.log(`🚀 Making new request to: ${url}`);
  performanceMonitor.countRequest(url);
  
  // Create new request with optimized headers
  const promise = fetch(url, {
    ...fetchOptions,
    headers: {
      'Cache-Control': 'max-age=180, stale-while-revalidate=60', // 3 minutes cache with stale-while-revalidate
      'Accept': 'application/json',
      'Connection': 'keep-alive',
      ...fetchOptions?.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  }).finally(() => {
    // Remove from cache when request completes
    requestCache.delete(cacheKey);
  });
  
  // Cache the promise
  requestCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });
  
  console.log(`Making new request for: ${url}`);
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
 * Fetches trending products with deduplication
 */
export const fetchTrendingProducts = async () => {
  return deduplicateRequest('/api/customer/trending');
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
