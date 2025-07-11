// Performance monitoring utilities for the home page

export const logPerformanceMetrics = () => {
  if (typeof window === 'undefined') return;

  // Wait for the page to fully load
  window.addEventListener('load', () => {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    console.log('🚀 Page Performance Metrics:');
    console.log(`DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
    console.log(`Page Load Time: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
    console.log(`Total Page Load: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
    
    // Get resource timing for API calls
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const apiCalls = resources.filter(resource => resource.name.includes('/api/'));
    
    console.log(`📡 API Calls Made: ${apiCalls.length}`);
    apiCalls.forEach(api => {
      console.log(`  ${api.name}: ${Math.round(api.duration)}ms`);
    });
    
    // Check for duplicate API calls
    const apiUrls = apiCalls.map(api => api.name);
    const duplicates = apiUrls.filter((url, index) => apiUrls.indexOf(url) !== index);
    
    if (duplicates.length > 0) {
      console.warn('⚠️ Duplicate API calls detected:', [...new Set(duplicates)]);
    }
    
    // Log total number of requests
    console.log(`📦 Total Network Requests: ${resources.length}`);
    
    // Check for slow requests (>1000ms)
    const slowRequests = resources.filter(resource => resource.duration > 1000);
    if (slowRequests.length > 0) {
      console.warn('🐌 Slow requests (>1s):', slowRequests.map(r => ({ url: r.name, duration: Math.round(r.duration) })));
    }
  });
};

export const measureApiCallTime = async (url: string, fetchFunction: () => Promise<any>) => {
  const startTime = performance.now();
  
  try {
    const result = await fetchFunction();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${url}: ${Math.round(duration)}ms`);
    
    if (duration > 500) {
      console.warn(`⚠️ Slow API call: ${url} took ${Math.round(duration)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ ${url} failed after ${Math.round(duration)}ms:`, error);
    throw error;
  }
};

export const getBrowserInfo = () => {
  if (typeof window === 'undefined') return null;
  
  const userAgent = navigator.userAgent;
  const isEdge = /Edge|Edg\//.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg\//.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  
  return {
    userAgent,
    isEdge,
    isChrome,
    isFirefox,
    isSafari,
    connection: (navigator as any).connection || null
  };
};

// Enhanced performance monitoring and request optimization utilities
import { deduplicateRequest, fetchCategories, fetchAuthUser, fetchUserCart, requestCache, CACHE_TIMEOUT, type PendingRequest } from './apiUtils';

interface RequestMetrics {
  url: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  errorCount: number;
}

// Performance monitoring
const performanceMetrics = new Map<string, RequestMetrics[]>();


/**
 * Enhanced request deduplication with performance monitoring
 */
export const monitoredRequest = async <T>(
  url: string,
  fetchOptions?: RequestInit
): Promise<T> => {
  const startTime = performance.now();
  const cacheKey = `${url}:${JSON.stringify(fetchOptions || {})}`;
  
  try {
    // Check for existing request
    const cached = requestCache.get(cacheKey);
    const isCacheHit = !!cached && (Date.now() - cached.timestamp < CACHE_TIMEOUT);
    
    let result: T;
    
    if (isCacheHit) {
      result = await cached!.promise;
    } else {
      // Make new request with enhanced error handling
      const promise = fetch(url, {
        ...fetchOptions,
        headers: {
          'Cache-Control': 'max-age=300',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Request failed`);
        }
        return response.json();
      });
      
      // Cache the new request
      requestCache.set(cacheKey, {
        promise,
        timestamp: Date.now(),
      });
      
      result = await promise;
    }
    
    // Record performance metrics
    const duration = performance.now() - startTime;
    recordMetrics(url, duration, isCacheHit, false);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    recordMetrics(url, duration, false, true);
    throw error;
  }
};

/**
 * Record performance metrics for analysis
 */
const recordMetrics = (
  url: string,
  duration: number,
  cacheHit: boolean,
  isError: boolean
) => {
  const baseUrl = url.split('?')[0]; // Group by endpoint
  const existing = performanceMetrics.get(baseUrl) || [];
  
  existing.push({
    url: baseUrl,
    duration,
    timestamp: Date.now(),
    cacheHit,
    errorCount: isError ? 1 : 0,
  });
  
  // Keep only last 100 entries per endpoint
  if (existing.length > 100) {
    existing.splice(0, existing.length - 100);
  }
  
  performanceMetrics.set(baseUrl, existing);
};

/**
 * Get performance report for debugging
 */
export const getPerformanceReport = () => {
  const report: Record<string, {
    totalRequests: number;
    avgDuration: number;
    cacheHitRate: number;
    errorRate: number;
    lastUsed: number;
  }> = {};
  
  performanceMetrics.forEach((metrics, url) => {
    const totalRequests = metrics.length;
    const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const errors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const lastUsed = Math.max(...metrics.map(m => m.timestamp));
    
    report[url] = {
      totalRequests,
      avgDuration: Math.round(avgDuration * 100) / 100,
      cacheHitRate: Math.round((cacheHits / totalRequests) * 100),
      errorRate: Math.round((errors / totalRequests) * 100),
      lastUsed,
    };
  });
  
  return report;
};

/**
 * Preload critical resources
 */
export const preloadCriticalData = async () => {
  try {
    console.log('Preloading critical data...');
    
    // Preload categories (most commonly used)
    fetchCategories().catch(err => console.warn('Failed to preload categories:', err));
    
    // Preload user data if available
    if (typeof window !== 'undefined' && localStorage.getItem('auth-token')) {
      fetchAuthUser().catch(err => console.warn('Failed to preload user data:', err));
      fetchUserCart().catch(err => console.warn('Failed to preload cart:', err));
    }
    
  } catch (error) {
    console.warn('Preload failed:', error);
  }
};

/**
 * Smart cache warming for frequently accessed data
 */
export const warmCache = async (endpoints: string[]) => {
  console.log('Warming cache for endpoints:', endpoints);
  
  const promises = endpoints.map(endpoint => 
    deduplicateRequest(endpoint).catch(err => 
      console.warn(`Failed to warm cache for ${endpoint}:`, err)
    )
  );
  
  await Promise.allSettled(promises);
};

/**
 * Clean up expired cache entries
 */
export const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;
  
  requestCache.forEach((cached: PendingRequest, key: string) => {
    if (now - cached.timestamp > CACHE_TIMEOUT) {
      requestCache.delete(key);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired cache entries`);
  }
};

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}
