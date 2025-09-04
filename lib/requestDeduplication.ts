// Request deduplication utility to prevent duplicate API calls during page load
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly REQUEST_TIMEOUT = 5000; // Increased to 5 seconds for better deduplication

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up expired requests
    this.cleanupExpiredRequests();

    // Check if request is already pending
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return existingRequest.promise;
    }

    // Make new request
    console.log(`🚀 Making new request: ${key}`);
    const promise = requestFn().finally(() => {
      // Remove from pending requests when completed
      this.pendingRequests.delete(key);
    });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  private cleanupExpiredRequests() {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key);
        console.log(`🧹 Cleaned up expired request: ${key}`);
      }
    }
  }

  // Clear all pending requests (useful for testing)
  clear() {
    this.pendingRequests.clear();
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

// Helper function for API calls
export const deduplicatedFetch = async (url: string, options?: RequestInit) => {
  const key = `${options?.method || 'GET'}:${url}:${JSON.stringify(options?.body) || ''}`;
  
  return requestDeduplicator.deduplicate(key, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  });
};
