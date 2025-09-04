import React from 'react';

// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    this.marks.set(label, performance.now());
    console.log(`⏱️ Started timing: ${label}`);
  }

  endTiming(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`⚠️ No start time found for ${label}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ ${label}: ${duration.toFixed(2)}ms`);
    this.marks.delete(label);
    return duration;
  }

  countRequest(url: string): void {
    const count = this.requestCounts.get(url) || 0;
    this.requestCounts.set(url, count + 1);
    
    if (count > 0) {
      console.warn(`🔄 Duplicate request detected: ${url} (${count + 1} times)`);
    }
  }

  getRequestStats(): Record<string, number> {
    return Object.fromEntries(this.requestCounts.entries());
  }

  reset(): void {
    this.marks.clear();
    this.requestCounts.clear();
  }

  // Log Core Web Vitals
  logWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
          }
          if (entry.entryType === 'first-contentful-paint') {
            console.log(`📊 FCP: ${entry.startTime.toFixed(2)}ms`);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint'] });
      } catch (e) {
        console.log('Performance observer not supported');
      }
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook to monitor page performance
export function usePagePerformance(pageName: string) {
  React.useEffect(() => {
    performanceMonitor.startTiming(`${pageName}-load`);
    performanceMonitor.logWebVitals();

    return () => {
      performanceMonitor.endTiming(`${pageName}-load`);
    };
  }, [pageName]);
}

// Enhanced fetch with performance monitoring
export async function monitoredFetch(url: string, options?: RequestInit): Promise<Response> {
  performanceMonitor.countRequest(url);
  performanceMonitor.startTiming(`fetch-${url}`);
  
  try {
    const response = await fetch(url, options);
    performanceMonitor.endTiming(`fetch-${url}`);
    return response;
  } catch (error) {
    performanceMonitor.endTiming(`fetch-${url}`);
    throw error;
  }
}
