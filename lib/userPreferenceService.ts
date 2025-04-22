// Types for tracking user preferences
export interface ProductViewData {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  colors?: string[];
  sizes?: string[];
  price: number;
}

interface UserPreferences {
  viewedProducts: ProductViewData[];
  preferredCategories: Record<string, number>; // category name -> weight
  preferredColors: Record<string, number>; // color -> weight
  preferredSizes: Record<string, number>; // size -> weight
  priceRanges: {
    min: number;
    max: number;
    count: number;
  }[];
}

// Define interface for tracking product actions
export interface ProductActionData extends ProductViewData {
  action: 'add_to_cart' | 'remove_from_cart' | 'add_to_wishlist' | 'remove_from_wishlist';
  quantity?: number;
}

// Local storage key for saving user preferences
const USER_PREFS_KEY = 'pinnacle_user_preferences';
const CHATBOT_CONTEXT_KEY = 'pinnacle_chatbot_context';

// Get user preferences from localStorage
const getUserPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') {
    return {
      viewedProducts: [],
      preferredCategories: {},
      preferredColors: {},
      preferredSizes: {},
      priceRanges: []
    };
  }

  const storedPrefs = localStorage.getItem(USER_PREFS_KEY);
  if (!storedPrefs) {
    return {
      viewedProducts: [],
      preferredCategories: {},
      preferredColors: {},
      preferredSizes: {},
      priceRanges: []
    };
  }

  try {
    return JSON.parse(storedPrefs);
  } catch (e) {
    console.error('Error parsing user preferences:', e);
    return {
      viewedProducts: [],
      preferredCategories: {},
      preferredColors: {},
      preferredSizes: {},
      priceRanges: []
    };
  }
};

// Save user preferences to localStorage
const saveUserPreferences = (prefs: UserPreferences): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
};

// Track when a user views a product
export const trackProductView = (product: ProductViewData): void => {
  const prefs = getUserPreferences();
  
  // Add to viewed products (keep only the last 20)
  const existingIndex = prefs.viewedProducts.findIndex(p => p.id === product.id);
  if (existingIndex >= 0) {
    prefs.viewedProducts.splice(existingIndex, 1);
  }
  prefs.viewedProducts.unshift(product);
  prefs.viewedProducts = prefs.viewedProducts.slice(0, 20);
  
  // Update category preference
  if (product.category) {
    prefs.preferredCategories[product.category] = 
      (prefs.preferredCategories[product.category] || 0) + 1;
  }
  
  // Update color preferences
  if (product.colors && product.colors.length > 0) {
    product.colors.forEach(color => {
      prefs.preferredColors[color] = 
        (prefs.preferredColors[color] || 0) + 1;
    });
  }
  
  // Update size preferences
  if (product.sizes && product.sizes.length > 0) {
    product.sizes.forEach(size => {
      prefs.preferredSizes[size] = 
        (prefs.preferredSizes[size] || 0) + 1;
    });
  }
  
  // Update price range
  const price = product.price;
  let rangeFound = false;
  
  for (const range of prefs.priceRanges) {
    if (price >= range.min && price <= range.max) {
      range.count++;
      rangeFound = true;
      break;
    }
  }
  
  if (!rangeFound) {
    // Create new price range in $50 increments
    const min = Math.floor(price / 50) * 50;
    const max = min + 49.99;
    prefs.priceRanges.push({ min, max, count: 1 });
  }
  
  saveUserPreferences(prefs);
};

// New function to track product actions (cart and wishlist operations)
export const trackProductAction = (productData: ProductActionData): void => {
  const prefs = getUserPreferences();
  
  // Track the action in user preferences
  if (productData.action === 'add_to_cart') {
    // Increase the preference weight for this product's attributes
    if (productData.category) {
      prefs.preferredCategories[productData.category] = 
        (prefs.preferredCategories[productData.category] || 0) + 2; // Higher weight for cart additions
    }
    
    if (productData.colors && productData.colors.length > 0) {
      productData.colors.forEach(color => {
        prefs.preferredColors[color] = 
          (prefs.preferredColors[color] || 0) + 2;
      });
    }
    
    if (productData.sizes && productData.sizes.length > 0) {
      productData.sizes.forEach(size => {
        prefs.preferredSizes[size] = 
          (prefs.preferredSizes[size] || 0) + 2;
      });
    }
  }
  
  // For remove actions, slightly decrease preference
  if (productData.action === 'remove_from_cart') {
    if (productData.category && prefs.preferredCategories[productData.category]) {
      prefs.preferredCategories[productData.category] = 
        Math.max(0, prefs.preferredCategories[productData.category] - 1);
    }
    
    if (productData.colors && productData.colors.length > 0) {
      productData.colors.forEach(color => {
        if (prefs.preferredColors[color]) {
          prefs.preferredColors[color] = Math.max(0, prefs.preferredColors[color] - 1);
        }
      });
    }
    
    if (productData.sizes && productData.sizes.length > 0) {
      productData.sizes.forEach(size => {
        if (prefs.preferredSizes[size]) {
          prefs.preferredSizes[size] = Math.max(0, prefs.preferredSizes[size] - 1);
        }
      });
    }
  }
  
  // Track wishlist actions
  if (productData.action === 'add_to_wishlist') {
    if (productData.category) {
      prefs.preferredCategories[productData.category] = 
        (prefs.preferredCategories[productData.category] || 0) + 1;
    }
    
    // Similar patterns for colors and sizes
    if (productData.colors && productData.colors.length > 0) {
      productData.colors.forEach(color => {
        prefs.preferredColors[color] = 
          (prefs.preferredColors[color] || 0) + 1;
      });
    }
    
    if (productData.sizes && productData.sizes.length > 0) {
      productData.sizes.forEach(size => {
        prefs.preferredSizes[size] = 
          (prefs.preferredSizes[size] || 0) + 1;
      });
    }
  }
  
  // Save updated preferences
  saveUserPreferences(prefs);
};

// Get user context for the chatbot
export const getChatbotUserContext = (): string => {
  const prefs = getUserPreferences();
  
  // Get top categories
  const topCategories = Object.entries(prefs.preferredCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
  
  // Get top colors
  const topColors = Object.entries(prefs.preferredColors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color);
  
  // Get top sizes
  const topSizes = Object.entries(prefs.preferredSizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([size]) => size);
  
  // Get preferred price range
  const topPriceRange = [...prefs.priceRanges]
    .sort((a, b) => b.count - a.count)
    .slice(0, 1)[0];
  
  // Get recently viewed products
  const recentProducts = prefs.viewedProducts
    .slice(0, 5)
    .map(p => p.name);
  
  const context = {
    preferredCategories: topCategories,
    preferredColors: topColors,
    preferredSizes: topSizes,
    priceRange: topPriceRange 
      ? `$${topPriceRange.min} to $${topPriceRange.max}`
      : 'Not enough data',
    recentlyViewed: recentProducts
  };
  
  // Save this context for chatbot use
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHATBOT_CONTEXT_KEY, JSON.stringify(context));
  }
  
  return JSON.stringify(context);
};
