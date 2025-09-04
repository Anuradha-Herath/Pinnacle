// Utility functions for fetch requests with Edge browser compatibility

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch function with timeout and better error handling for Edge browser
 */
export const fetchWithTimeout = async (
  url: string, 
  options: FetchOptions = {}
): Promise<Response> => {
  const { timeout = 10000, ...fetchOptions } = options;
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Default headers for better compatibility
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Accept': 'application/json',
    };
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
      signal: controller.signal,
      credentials: 'same-origin', // Important for Edge
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    }
    
    throw new Error('Network request failed');
  }
};

/**
 * Fetch JSON data with automatic error handling
 */
export const fetchJSON = async <T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> => {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Response is not JSON');
  }
  
  return response.json();
};

/**
 * Wrapper for GET requests
 */
export const get = <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
  return fetchJSON<T>(url, { ...options, method: 'GET' });
};

/**
 * Wrapper for POST requests
 */
export const post = <T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> => {
  return fetchJSON<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Wrapper for PUT requests
 */
export const put = <T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> => {
  return fetchJSON<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Wrapper for DELETE requests
 */
export const del = <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
  return fetchJSON<T>(url, { ...options, method: 'DELETE' });
};
