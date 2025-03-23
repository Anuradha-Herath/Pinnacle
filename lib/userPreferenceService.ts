interface ProductView {
  id: string;
  name: string;
  timestamp: number;
}

interface UserPreferences {
  viewedProducts: ProductView[];
  categories: Record<string, number>;
  subCategories: Record<string, number>;
  colors: Record<string, number>;
  sizes: Record<string, number>;
  priceRanges: Record<string, number>;
  purchasedSizes: Record<string, Record<string, number>>; // Category -> Size -> Count
  preferredFitTypes: Record<string, number>;
  userMeasurements?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    preferredFit?: string;
  };
}

const STORAGE_KEY = 'pinnacle_user_preferences';
const MAX_VIEWED_PRODUCTS = 20;

// Initialize empty preferences structure
const createEmptyPreferences = (): UserPreferences => ({
  viewedProducts: [],
  categories: {},
  subCategories: {},
  colors: {},
  sizes: {},
  priceRanges: {},
  purchasedSizes: {},
  preferredFitTypes: {},
  userMeasurements: {},
});

// Load preferences from storage with better error handling
export const loadUserPreferences = (): UserPreferences => {
  try {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Parse stored preferences and validate structure
        const parsedPreferences = JSON.parse(stored);
        
        // Ensure all required properties exist
        const validatedPreferences: UserPreferences = {
          viewedProducts: Array.isArray(parsedPreferences.viewedProducts) ? parsedPreferences.viewedProducts : [],
          categories: typeof parsedPreferences.categories === 'object' ? parsedPreferences.categories : {},
          subCategories: typeof parsedPreferences.subCategories === 'object' ? parsedPreferences.subCategories : {},
          colors: typeof parsedPreferences.colors === 'object' ? parsedPreferences.colors : {},
          sizes: typeof parsedPreferences.sizes === 'object' ? parsedPreferences.sizes : {},
          priceRanges: typeof parsedPreferences.priceRanges === 'object' ? parsedPreferences.priceRanges : {},
          purchasedSizes: typeof parsedPreferences.purchasedSizes === 'object' ? parsedPreferences.purchasedSizes : {},
          preferredFitTypes: typeof parsedPreferences.preferredFitTypes === 'object' ? parsedPreferences.preferredFitTypes : {},
          userMeasurements: typeof parsedPreferences.userMeasurements === 'object' ? parsedPreferences.userMeasurements : {},
        };
        
        return validatedPreferences;
      }
    }
    return createEmptyPreferences();
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return createEmptyPreferences();
  }
};

// Save preferences to storage
export const saveUserPreferences = (preferences: UserPreferences) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

// Record a product view
export const trackProductView = (product: any) => {
  if (!product || !product.id) return;
  
  try {
    const preferences = loadUserPreferences();
    
    // Ensure viewedProducts is always an array
    if (!Array.isArray(preferences.viewedProducts)) {
      console.warn('viewedProducts was not an array, initializing empty array');
      preferences.viewedProducts = [];
    }
    
    // Add to viewed products
    const existingIndex = preferences.viewedProducts.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      // Move to top of list and update timestamp
      const existing = preferences.viewedProducts.splice(existingIndex, 1)[0];
      existing.timestamp = Date.now();
      preferences.viewedProducts.unshift(existing);
    } else {
      // Add new product view
      preferences.viewedProducts.unshift({
        id: product.id,
        name: product.name || 'Product',
        timestamp: Date.now()
      });
      
      // Limit to max items
      if (preferences.viewedProducts.length > MAX_VIEWED_PRODUCTS) {
        preferences.viewedProducts = preferences.viewedProducts.slice(0, MAX_VIEWED_PRODUCTS);
      }
    }
    
    // Update category preference
    if (product.category) {
      preferences.categories[product.category] = (preferences.categories[product.category] || 0) + 1;
    }
    
    // Update subcategory preference
    if (product.subCategory) {
      preferences.subCategories[product.subCategory] = (preferences.subCategories[product.subCategory] || 0) + 1;
    }
    
    // Update color preferences from gallery
    if (Array.isArray(product.colors)) {
      product.colors.forEach((color: string) => {
        if (color) {
          preferences.colors[color] = (preferences.colors[color] || 0) + 1;
        }
      });
    }
    
    // Update size preferences
    if (Array.isArray(product.sizes)) {
      product.sizes.forEach((size: string) => {
        if (size) {
          preferences.sizes[size] = (preferences.sizes[size] || 0) + 1;
        }
      });
    }
    
    // Track price range
    const price = product.price;
    if (typeof price === 'number') {
      let priceRange = 'unknown';
      if (price < 25) priceRange = 'budget';
      else if (price < 50) priceRange = 'economy';
      else if (price < 100) priceRange = 'mid-range';
      else if (price < 200) priceRange = 'premium';
      else priceRange = 'luxury';
      
      preferences.priceRanges[priceRange] = (preferences.priceRanges[priceRange] || 0) + 1;
    }
    
    saveUserPreferences(preferences);
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};

// Track cart or wishlist actions
export const trackProductAction = (product: any, action: 'cart' | 'wishlist') => {
  if (!product || !product.id) return;
  
  try {
    // Track with higher weight (multiply by 2 since it shows stronger interest)
    const preferences = loadUserPreferences();
    
    // Ensure needed objects exist
    if (typeof preferences.categories !== 'object') preferences.categories = {};
    if (typeof preferences.subCategories !== 'object') preferences.subCategories = {};
    
    // Update category preference with higher weight
    if (product.category) {
      preferences.categories[product.category] = (preferences.categories[product.category] || 0) + 2;
    }
    
    // Update subcategory preference with higher weight
    if (product.subCategory) {
      preferences.subCategories[product.subCategory] = (preferences.subCategories[product.subCategory] || 0) + 2;
    }
    
    saveUserPreferences(preferences);
  } catch (error) {
    console.error('Error tracking product action:', error);
  }
};

// Get top preferences for a specific attribute
export const getTopPreferences = (attribute: keyof UserPreferences, limit = 3): string[] => {
  try {
    const preferences = loadUserPreferences();
    
    if (!preferences || !preferences[attribute] || typeof preferences[attribute] !== 'object') {
      return [];
    }
    
    return Object.entries(preferences[attribute] as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(item => item[0]);
  } catch (error) {
    console.error(`Error getting top preferences for ${attribute}:`, error);
    return [];
  }
};

// Generate a summary of user preferences
export const getUserPreferenceSummary = (): string => {
  const preferences = loadUserPreferences();
  
  // Get top preferences
  const topCategories = getTopPreferences('categories');
  const topSubcategories = getTopPreferences('subCategories');
  const topColors = getTopPreferences('colors');
  const topSizes = getTopPreferences('sizes');
  const topPriceRanges = getTopPreferences('priceRanges');
  
  // Generate summary
  let summary = "User preferences:";
  
  if (topCategories.length > 0) {
    summary += ` Categories: ${topCategories.join(', ')}.`;
  }
  
  if (topSubcategories.length > 0) {
    summary += ` Subcategories: ${topSubcategories.join(', ')}.`;
  }
  
  if (topColors.length > 0) {
    summary += ` Colors: ${topColors.join(', ')}.`;
  }
  
  if (topSizes.length > 0) {
    summary += ` Sizes: ${topSizes.join(', ')}.`;
  }
  
  if (topPriceRanges.length > 0) {
    summary += ` Price ranges: ${topPriceRanges.join(', ')}.`;
  }
  
  // Add recently viewed products
  if (preferences.viewedProducts && preferences.viewedProducts.length > 0) {
    const recentProducts = preferences.viewedProducts.slice(0, 3).map(p => p.name);
    summary += ` Recently viewed: ${recentProducts.join(', ')}.`;
  }
  
  return summary;
};

// Export a unified function for the chatbot to get user context
export const getChatbotUserContext = (): {
  recentlyViewed: string[];
  topCategories: string[];
  topColors: string[];
  topSizes: string[];
  topPriceRanges: string[];
  preferredSizes: Record<string, string>;
  measurements: any;
  preferredFitTypes: string[];
} => {
  try {
    const preferences = loadUserPreferences();
    
    // Add null checks to handle potentially undefined values
    const preferredSizes: Record<string, string> = {};
    if (preferences.purchasedSizes) {
      Object.keys(preferences.purchasedSizes).forEach(category => {
        const topSize = getPreferredSizeForCategory(category);
        if (topSize) preferredSizes[category] = topSize;
      });
    }
    
    // Get top preferred fit types
    const preferredFitTypes = Object.entries(preferences.preferredFitTypes || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(item => item[0]);
    
    return {
      recentlyViewed: Array.isArray(preferences.viewedProducts) 
        ? preferences.viewedProducts.slice(0, 5).map(p => p.name || 'Product')
        : [],
      topCategories: getTopPreferences('categories', 3),
      topColors: getTopPreferences('colors', 3),
      topSizes: getTopPreferences('sizes', 3),
      topPriceRanges: getTopPreferences('priceRanges', 2),
      preferredSizes,
      measurements: preferences.userMeasurements || {},
      preferredFitTypes
    };
  } catch (error) {
    console.error('Error getting chatbot user context:', error);
    // Return empty arrays if there's any error
    return {
      recentlyViewed: [],
      topCategories: [],
      topColors: [],
      topSizes: [],
      topPriceRanges: [],
      preferredSizes: {},
      measurements: {},
      preferredFitTypes: []
    };
  }
};

// Clear user preferences
export const clearUserPreferences = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Track an order with size information (called after order completion)
export const trackOrderWithSize = (orderItems: any[]) => {
  try {
    const preferences = loadUserPreferences();
    
    // Ensure purchasedSizes exists
    if (!preferences.purchasedSizes) preferences.purchasedSizes = {};
    
    // Process each ordered item
    orderItems.forEach(item => {
      if (item.category && item.size) {
        // Initialize category if needed
        if (!preferences.purchasedSizes[item.category]) {
          preferences.purchasedSizes[item.category] = {};
        }
        
        // Increment size count for this category
        preferences.purchasedSizes[item.category][item.size] = 
          (preferences.purchasedSizes[item.category][item.size] || 0) + 1;
      }
      
      // Track fit type preferences
      if (item.fitType) {
        preferences.preferredFitTypes[item.fitType] = 
          (preferences.preferredFitTypes[item.fitType] || 0) + 1;
      }
    });
    
    saveUserPreferences(preferences);
  } catch (error) {
    console.error('Error tracking order with sizes:', error);
  }
};

// Save user measurements
export const saveUserMeasurements = (measurements: {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  preferredFit?: string;
}) => {
  try {
    const preferences = loadUserPreferences();
    
    // Update user measurements
    preferences.userMeasurements = {
      ...preferences.userMeasurements,
      ...measurements
    };
    
    saveUserPreferences(preferences);
    return true;
  } catch (error) {
    console.error('Error saving user measurements:', error);
    return false;
  }
};

// Get user's preferred size for a category
export const getPreferredSizeForCategory = (category: string): string | null => {
  try {
    const preferences = loadUserPreferences();
    
    if (!preferences.purchasedSizes || !preferences.purchasedSizes[category]) {
      return null;
    }
    
    // Find the most frequently purchased size in this category
    const sizeEntries = Object.entries(preferences.purchasedSizes[category]);
    if (sizeEntries.length === 0) return null;
    
    // Sort by purchase count descending and get the top one
    const [topSize] = sizeEntries.sort((a, b) => b[1] - a[1])[0];
    return topSize;
  } catch (error) {
    console.error('Error getting preferred size:', error);
    return null;
  }
};
