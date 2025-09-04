/**
 * Pre-fetching utilities for trending products data
 */

import { fetchTrendingProducts } from './apiUtils';

/**
 * Prefetch trending products data for faster initial load
 * Call this during idle time or app initialization
 */
export const prefetchTrendingProducts = async (): Promise<void> => {
  try {
    console.log('Pre-fetching trending products data...');
    const startTime = performance.now();
    
    // Fetch trending products in the background
    await fetchTrendingProducts();
    
    const endTime = performance.now();
    console.log(`Trending products pre-fetched in ${Math.round(endTime - startTime)}ms`);
  } catch (error) {
    // Silent failure for prefetching
    console.error('Failed to pre-fetch trending products:', error);
  }
};

/**
 * Prefetch trending products when the browser is idle
 */
export const prefetchTrendingWhenIdle = (): void => {
  if (typeof window === 'undefined') return;
  
  // Don't prefetch on profile pages or other non-home pages
  if (window.location.pathname !== '/') {
    return;
  }
  
  // Use requestIdleCallback if available, otherwise use a delayed timeout
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      prefetchTrendingProducts();
    }, { timeout: 2000 }); // 2 second timeout
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      prefetchTrendingProducts();
    }, 1000); // 1 second delay
  }
};
