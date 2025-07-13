// Simple request deduplication utility without complex caching

class SimpleRequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  // Deduplicate concurrent requests to the same endpoint
  async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If the same request is already pending, return that promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = requestFn()
      .then(result => {
        // Remove from pending requests when done
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Remove from pending requests on error too
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the pending promise
    this.pendingRequests.set(key, promise);
    
    return promise;
  }

  // Clear all pending requests (useful for cleanup)
  clear(): void {
    this.pendingRequests.clear();
  }
}

// Helper function for requests with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
};

// Global deduplicator instance
export const requestDeduplicator = new SimpleRequestDeduplicator();

// Health check function to test API availability
export const checkApiHealth = async (): Promise<{ healthy: boolean; issues: string[] }> => {
  const issues: string[] = [];
  let healthy = true;
  
  try {
    // Test basic API endpoint
    const healthResponse = await fetchWithTimeout('/api/health', {}, 5000);
    if (!healthResponse.ok) {
      issues.push(`Health endpoint returned ${healthResponse.status}`);
      healthy = false;
    }
  } catch (error) {
    issues.push(`Health endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    healthy = false;
  }
  
  try {
    // Test database connectivity
    const dbResponse = await fetchWithTimeout('/api/db-status', {}, 5000);
    if (!dbResponse.ok) {
      issues.push(`Database connectivity check failed: ${dbResponse.status}`);
      healthy = false;
    }
  } catch (error) {
    issues.push(`Database connectivity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    healthy = false;
  }
  
  return { healthy, issues };
};

// Simple fetch with deduplication and enhanced error handling
export const simpleFetch = async <T = any>(
  url: string, 
  options?: RequestInit,
  retries: number = 2,
  timeout: number = 10000
): Promise<T> => {
  const key = `${url}${JSON.stringify(options || {})}`;
  
  return requestDeduplicator.deduplicateRequest(key, async () => {
    let lastError: Error | null = null;
    
    // Try the request with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, options, timeout);
        
        if (!response.ok) {
          // Try to get error details from response body
          let errorDetails = '';
          let errorBody: any = null;
          
          try {
            const responseText = await response.text();
            if (responseText) {
              errorBody = JSON.parse(responseText);
              errorDetails = errorBody?.error || errorBody?.message || response.statusText;
            } else {
              errorDetails = response.statusText;
            }
          } catch (parseError) {
            // If we can't parse the error response, use status text
            errorDetails = response.statusText;
            console.error(`Failed to parse error response from ${url}:`, parseError);
          }
          
          // Log the full error for debugging
          console.error(`API Error - ${url} (attempt ${attempt + 1}):`, {
            status: response.status,
            statusText: response.statusText,
            error: errorDetails,
            body: errorBody,
            headers: Object.fromEntries(response.headers.entries()),
            url: url,
            attempt: attempt + 1,
            maxRetries: retries + 1
          });
          
          // For 5xx errors, we might want to retry
          if (response.status >= 500 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`Server error (${response.status}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Create a more descriptive error message
          const errorContext = errorBody?.details ? ` (${JSON.stringify(errorBody.details)})` : '';
          throw new Error(`${errorDetails}${errorContext} [${response.status} from ${url}]`);
        }
        
        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Handle network errors, timeouts, etc.
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error(`Network Error - ${url} (attempt ${attempt + 1}):`, error);
          if (attempt < retries) {
            const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // Cap at 5 seconds
            console.warn(`Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For timeout errors, retry
        if (error instanceof Error && (error.message.includes('timeout') || error.name === 'AbortError') && attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // Cap at 5 seconds
          console.warn(`Request timeout/abort, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For ECONNRESET and connection errors, retry
        if (error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('ECONNREFUSED')) && attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // Cap at 5 seconds
          console.warn(`Connection error (${error.message}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Re-throw our custom API errors (don't retry client errors)
        if (error instanceof Error && error.message.includes('API Error') && error.message.includes('(4')) {
          throw error;
        }
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          break;
        }
      }
    }
    
    // If we get here, all retries failed
    if (lastError) {
      if (lastError.message.includes('fetch') || lastError.message.includes('Network')) {
        throw new Error(`Network Error: Unable to connect to ${url}. Please check your connection.`);
      }
      throw lastError;
    }
    
    throw new Error(`Request failed after ${retries + 1} attempts: ${url}`);
  });
};

// Specific helper functions for common API calls with fallback handling
export const apiHelpers = {
  // Get product details
  getProduct: async (productId: string) => {
    try {
      return await simpleFetch(`/api/products?id=${productId}`);
    } catch (error) {
      console.error('Failed to get product:', error);
      throw new Error(`Unable to load product details. ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  },
    
  // Get product reviews
  getProductReviews: async (productId: string) => {
    try {
      return await simpleFetch(`/api/reviews?productId=${productId}`);
    } catch (error) {
      console.error('Failed to get product reviews:', error);
      // Return empty reviews instead of failing completely
      return { success: true, reviews: [] };
    }
  },
    
  // Get user cart
  getUserCart: async () => {
    try {
      return await simpleFetch('/api/user/cart');
    } catch (error) {
      console.error('Failed to get user cart:', error);
      // Return empty cart instead of failing completely
      return { success: true, cart: [] };
    }
  },
    
  // Get user wishlist
  getUserWishlist: async () => {
    try {
      return await simpleFetch('/api/user/wishlist');
    } catch (error) {
      console.error('Failed to get user wishlist:', error);
      // Return empty wishlist instead of failing completely
      return { success: true, wishlist: [] };
    }
  },
    
  // Get categories
  getCategories: async () => {
    try {
      return await simpleFetch('/api/categories');
    } catch (error) {
      console.error('Failed to get categories:', error);
      // Return empty categories instead of failing completely
      return { categories: [] };
    }
  },
    
  // Get related products
  getRelatedProducts: async (category: string, limit: number = 6) => {
    try {
      return await simpleFetch(`/api/customer/products?category=${encodeURIComponent(category)}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to get related products:', error);
      // Return empty products instead of failing completely
      return { products: [] };
    }
  },
    
  // Get inventory
  getInventory: async (productId: string) => {
    try {
      return await simpleFetch(`/api/inventory/product/${productId}`);
    } catch (error) {
      console.error('Failed to get inventory:', error);
      // Return default inventory data instead of failing completely
      return { 
        success: true, 
        inventory: { 
          stock: 0, 
          isAvailable: false 
        } 
      };
    }
  }
};

// Debug function to test all API helpers (can be called from browser console)
export const debugApiHelpers = async () => {
  console.log('🔧 Testing all API helpers...');
  
  // First test database health
  try {
    console.log('Testing database health...');
    const dbTest = await simpleFetch('/api/db-test');
    console.log('✅ Database Test:', dbTest);
  } catch (error) {
    console.error('❌ Database Test:', error);
  }
  
  const tests = [
    { name: 'Categories', fn: apiHelpers.getCategories },
    { name: 'User Cart', fn: apiHelpers.getUserCart },
    { name: 'User Wishlist', fn: apiHelpers.getUserWishlist },
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await test.fn();
      console.log(`✅ ${test.name}:`, result);
    } catch (error) {
      console.error(`❌ ${test.name}:`, error);
    }
  }
  
  return 'Debug complete - check console for results';
};

// Make debugging function globally available in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugApiHelpers = debugApiHelpers;
  (window as any).checkApiHealth = checkApiHealth;
  (window as any).simpleFetch = simpleFetch;
  console.log('🔧 Debug tools available: debugApiHelpers(), checkApiHealth(), simpleFetch()');
}
