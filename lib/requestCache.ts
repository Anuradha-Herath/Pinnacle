// Request caching and deduplication utilities

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();

  // Get data from cache if valid
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // Set data in cache
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Deduplicate concurrent requests
  async fetchWithDeduplication<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = 300000
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached) return cached;

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Make new request
    const promise = fetchFn().then(data => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const requestCache = new RequestCache();

// Utility functions for common API calls
export const cachedApiCall = {
  // Cached fetch with automatic key generation
  fetch: async <T>(url: string, options?: RequestInit, ttl: number = 300000): Promise<T> => {
    const key = `${url}_${JSON.stringify(options || {})}`;
    
    return requestCache.fetchWithDeduplication(
      key,
      () => fetch(url, options).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      }),
      ttl
    );
  },

  // Product details with 5 minute cache
  getProductDetails: (productId: string) => 
    cachedApiCall.fetch(`/api/products/${productId}/detail`, undefined, 300000),

  // User cart with 1 minute cache (more frequent updates)
  getUserCart: () => 
    cachedApiCall.fetch('/api/user/cart', undefined, 60000),

  // User wishlist with 2 minute cache
  getUserWishlist: () => 
    cachedApiCall.fetch('/api/user/wishlist', undefined, 120000),

  // Categories with 10 minute cache (rarely changes)
  getCategories: () => 
    cachedApiCall.fetch('/api/categories', undefined, 600000),

  // Reviews with 5 minute cache
  getProductReviews: (productId: string) => 
    cachedApiCall.fetch(`/api/reviews?productId=${productId}`, undefined, 300000),
};

// Clear cache periodically
setInterval(() => {
  requestCache.clearExpired();
}, 60000); // Clear expired entries every minute
