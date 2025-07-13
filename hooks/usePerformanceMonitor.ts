"use client";

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

// Client-side performance utilities
export function logClientPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 Client ${operation}: ${duration.toFixed(2)}ms`, metadata || '');
  }
}

export function useClientTimer() {
  const startTime = performance.now();
  
  return {
    end: () => performance.now() - startTime,
    endAndLog: (operation: string, metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      logClientPerformance(operation, duration, metadata);
      return duration;
    }
  };
}
