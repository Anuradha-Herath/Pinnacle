import { API_ENDPOINTS, CATEGORIES } from "@/lib/constants";

/**
 * Service for handling product-related API calls
 */
export const productService = {
  /**
   * Fetch all products
   */
  async getAllProducts() {
    const response = await fetch(API_ENDPOINTS.PRODUCTS);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data = await response.json();
    return data.products || [];
  },

  /**
   * Fetch trending products
   */
  async getTrendingProducts() {
    const response = await fetch(API_ENDPOINTS.TRENDING);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending products');
    }
    
    const data = await response.json();
    return data.products || [];
  },

  /**
   * Fetch products by category
   */
  async getProductsByCategory(category: string) {
    // Convert 'men'/'women' to match API parameter ('Men'/'Women')
    let apiCategory = category;
    
    if (category === CATEGORIES.MEN.id) {
      apiCategory = CATEGORIES.MEN.apiName;
    } else if (category === CATEGORIES.WOMEN.id) {
      apiCategory = CATEGORIES.WOMEN.apiName;
    } else if (category === CATEGORIES.ACCESSORIES.id) {
      apiCategory = CATEGORIES.ACCESSORIES.apiName;
    }
    
    const response = await fetch(API_ENDPOINTS.CATEGORY(apiCategory));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${apiCategory} products`);
    }
    
    const data = await response.json();
    return data.products || [];
  }
};
