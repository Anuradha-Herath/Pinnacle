import { useEffect } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  apiCalls: number;
  cacheHits: number;
  totalImages: number;
}

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.group(`⚡ Performance Monitor: ${componentName}`);
        console.log(`Render time: ${renderTime.toFixed(2)}ms`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.groupEnd();
      }
    };
  }, [componentName]);
}

export function logCachePerformance(operation: string, hit: boolean, key: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗄️ Cache ${operation}: ${hit ? 'HIT' : 'MISS'} for key: ${key}`);
  }
}

export function logApiCall(url: string, duration?: number) {
  if (process.env.NODE_ENV === 'development') {
    const message = duration 
      ? `🌐 API Call: ${url} (${duration.toFixed(2)}ms)`
      : `🌐 API Call: ${url}`;
    console.log(message);
  }
}
