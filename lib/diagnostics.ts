// Diagnostic utilities to help identify and fix API issues

import { simpleFetch, checkApiHealth, apiHelpers } from './simpleRequestHelper';

export interface DiagnosticResult {
  endpoint: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  error?: string;
  data?: any;
}

export const runDiagnostics = async (): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  results: DiagnosticResult[];
  recommendations: string[];
}> => {
  const results: DiagnosticResult[] = [];
  const recommendations: string[] = [];
  
  // Test endpoints that commonly fail
  const testEndpoints = [
    { name: 'Health Check', test: () => simpleFetch('/api/health') },
    { name: 'DB Status', test: () => simpleFetch('/api/db-status') },
    { name: 'Categories', test: () => apiHelpers.getCategories() },
    { name: 'Products', test: () => simpleFetch('/api/customer/products?limit=1') },
  ];
  
  console.log('🔍 Running API diagnostics...');
  
  for (const endpoint of testEndpoints) {
    const startTime = Date.now();
    try {
      const data = await endpoint.test();
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint: endpoint.name,
        status: 'success',
        responseTime,
        data
      });
      
      console.log(`✅ ${endpoint.name}: ${responseTime}ms`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      results.push({
        endpoint: endpoint.name,
        status: responseTime > 10000 ? 'timeout' : 'error',
        responseTime,
        error: errorMessage
      });
      
      console.log(`❌ ${endpoint.name}: ${errorMessage} (${responseTime}ms)`);
      
      // Provide specific recommendations based on error type
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('connection')) {
        recommendations.push('Check database connection string and network connectivity');
      } else if (errorMessage.includes('timeout')) {
        recommendations.push('Database queries may be running slowly - check for missing indexes');
      } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        recommendations.push('Check database authentication credentials');
      } else if (errorMessage.includes('500')) {
        recommendations.push('Check server logs for specific error details');
      }
    }
  }
  
  // Determine overall health
  const errorCount = results.filter(r => r.status === 'error').length;
  const timeoutCount = results.filter(r => r.status === 'timeout').length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (errorCount === 0 && timeoutCount === 0) {
    overall = 'healthy';
  } else if (errorCount < results.length / 2) {
    overall = 'degraded';
    recommendations.push('Some services are experiencing issues');
  } else {
    overall = 'unhealthy';
    recommendations.push('Multiple critical services are down');
  }
  
  // Add performance recommendations
  const slowResponses = results.filter(r => r.responseTime > 2000);
  if (slowResponses.length > 0) {
    recommendations.push('Consider implementing response caching for better performance');
  }
  
  console.log(`🏥 Overall health: ${overall}`);
  
  return { overall, results, recommendations };
};

// Function to test a specific API endpoint with detailed logging
export const testEndpoint = async (url: string, options?: RequestInit): Promise<void> => {
  console.log(`🧪 Testing endpoint: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await simpleFetch(url, options);
    const endTime = Date.now();
    
    console.log(`✅ Success in ${endTime - startTime}ms:`, response);
  } catch (error) {
    console.error(`❌ Failed:`, error);
    
    // Try to provide more context
    if (error instanceof Error) {
      if (error.message.includes('500')) {
        console.log('💡 This is a server error. Check the API endpoint implementation and database connection.');
      } else if (error.message.includes('404')) {
        console.log('💡 Endpoint not found. Check the URL and routing configuration.');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Request timed out. The server may be overloaded or the database query is slow.');
      }
    }
  }
};

// Quick health check function
export const quickHealthCheck = async (): Promise<boolean> => {
  try {
    const { healthy } = await checkApiHealth();
    return healthy;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};
