"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  requestCount: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource');
        
        setMetrics({
          navigationStart: performance.timeOrigin,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          requestCount: resources.length
        });
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  if (!metrics || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64 text-sm">
          <h3 className="font-semibold mb-2">Performance Metrics</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>DOM Content Loaded:</span>
              <span className={metrics.domContentLoaded < 1000 ? 'text-green-600' : metrics.domContentLoaded < 2000 ? 'text-yellow-600' : 'text-red-600'}>
                {metrics.domContentLoaded.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Load Complete:</span>
              <span className={metrics.loadComplete < 2000 ? 'text-green-600' : metrics.loadComplete < 4000 ? 'text-yellow-600' : 'text-red-600'}>
                {metrics.loadComplete.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Requests:</span>
              <span className={metrics.requestCount < 20 ? 'text-green-600' : metrics.requestCount < 40 ? 'text-yellow-600' : 'text-red-600'}>
                {metrics.requestCount}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            Green: Good, Yellow: Fair, Red: Needs improvement
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
