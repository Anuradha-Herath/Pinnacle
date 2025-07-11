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

// Global deduplicator instance
export const requestDeduplicator = new SimpleRequestDeduplicator();

// Simple fetch with deduplication
export const simpleFetch = async <T = any>(url: string, options?: RequestInit): Promise<T> => {
  const key = `${url}${JSON.stringify(options || {})}`;
  
  return requestDeduplicator.deduplicateRequest(key, async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  });
};

// Specific helper functions for common API calls
export const apiHelpers = {
  // Get product details
  getProduct: (productId: string) => 
    simpleFetch(`/api/products?id=${productId}`),
    
  // Get product reviews
  getProductReviews: (productId: string) => 
    simpleFetch(`/api/reviews?productId=${productId}`),
    
  // Get user cart
  getUserCart: () => 
    simpleFetch('/api/user/cart'),
    
  // Get user wishlist
  getUserWishlist: () => 
    simpleFetch('/api/user/wishlist'),
    
  // Get categories
  getCategories: () => 
    simpleFetch('/api/categories'),
    
  // Get related products
  getRelatedProducts: (category: string, limit: number = 6) => 
    simpleFetch(`/api/customer/products?category=${encodeURIComponent(category)}&limit=${limit}`),
    
  // Get inventory
  getInventory: (productId: string) => 
    simpleFetch(`/api/inventory/product/${productId}`)
};
