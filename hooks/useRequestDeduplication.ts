import { useCallback, useRef } from 'react';
import { logApiCall } from './usePerformanceMonitor';

// Custom hook for request deduplication
export function useRequestDeduplication() {
  const pendingRequests = useRef(new Map<string, Promise<any>>());

  const deduplicatedFetch = useCallback(async (url: string, options?: RequestInit) => {
    const key = `${url}_${JSON.stringify(options || {})}`;
    const startTime = performance.now();
    
    // If request is already pending, return the existing promise
    if (pendingRequests.current.has(key)) {
      logApiCall(url, 0); // Deduplicated request
      return pendingRequests.current.get(key);
    }

    // Create new request
    const request = fetch(url, options)
      .then(response => {
        const endTime = performance.now();
        logApiCall(url, endTime - startTime);
        return response.json();
      })
      .finally(() => {
        // Clean up after request completes
        pendingRequests.current.delete(key);
      });

    // Store the promise
    pendingRequests.current.set(key, request);
    
    return request;
  }, []);

  return { deduplicatedFetch };
}
