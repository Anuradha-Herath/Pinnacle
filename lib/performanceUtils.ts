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
