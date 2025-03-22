"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ViewedProduct {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  timestamp: number;
}

interface LikedProduct {
  id: string;
  timestamp: number;
}

export interface UserPreferences {
  viewedProducts: ViewedProduct[];
  likedProducts: LikedProduct[];
  preferredCategories: Record<string, number>; // category -> weight
  preferredStyles: string[];
  preferredSeasons: string[];
  preferredOccasions: string[];
  preferredColors: string[];
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  trackProductView: (product: ViewedProduct) => void;
  trackProductLike: (productId: string) => void;
  trackProductUnlike: (productId: string) => void;
  updatePreferredStyles: (styles: string[]) => void;
  updatePreferredSeasons: (seasons: string[]) => void;
  updatePreferredOccasions: (occasions: string[]) => void;
  updatePreferredColors: (colors: string[]) => void;
  clearPreferences: () => void;
}

// Initial empty preferences
const initialPreferences: UserPreferences = {
  viewedProducts: [],
  likedProducts: [],
  preferredCategories: {},
  preferredStyles: [],
  preferredSeasons: [],
  preferredOccasions: [],
  preferredColors: []
};

// Create context with default values
const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: initialPreferences,
  trackProductView: () => {},
  trackProductLike: () => {},
  trackProductUnlike: () => {},
  updatePreferredStyles: () => {},
  updatePreferredSeasons: () => {},
  updatePreferredOccasions: () => {},
  updatePreferredColors: () => {},
  clearPreferences: () => {}
});

// Maximum number of viewed products to store
const MAX_VIEWED_PRODUCTS = 20;

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    const storedPreferences = localStorage.getItem('userPreferences');
    if (storedPreferences) {
      try {
        setPreferences(JSON.parse(storedPreferences));
      } catch (error) {
        console.error('Failed to parse stored preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Track when a user views a product
  const trackProductView = (product: ViewedProduct) => {
    setPreferences(prev => {
      // Remove the product if it's already in the list to avoid duplicates
      const filteredViewed = prev.viewedProducts.filter(p => p.id !== product.id);
      
      // Add the product to the beginning of the array with current timestamp
      const viewedProducts = [
        { ...product, timestamp: Date.now() },
        ...filteredViewed
      ].slice(0, MAX_VIEWED_PRODUCTS); // Keep only the most recent products
      
      // Update category preferences
      const preferredCategories = { ...prev.preferredCategories };
      const category = product.category.toLowerCase();
      const subCategory = product.subCategory.toLowerCase();
      
      // Increment category weight
      preferredCategories[category] = (preferredCategories[category] || 0) + 1;
      preferredCategories[subCategory] = (preferredCategories[subCategory] || 0) + 0.5;
      
      return {
        ...prev,
        viewedProducts,
        preferredCategories
      };
    });
  };

  // Track product likes
  const trackProductLike = (productId: string) => {
    setPreferences(prev => {
      if (prev.likedProducts.some(p => p.id === productId)) {
        return prev; // Already liked
      }
      return {
        ...prev,
        likedProducts: [...prev.likedProducts, { id: productId, timestamp: Date.now() }]
      };
    });
  };

  // Track product unlikes
  const trackProductUnlike = (productId: string) => {
    setPreferences(prev => ({
      ...prev,
      likedProducts: prev.likedProducts.filter(p => p.id !== productId)
    }));
  };

  // Update preferred styles
  const updatePreferredStyles = (styles: string[]) => {
    setPreferences(prev => ({
      ...prev,
      preferredStyles: styles
    }));
  };

  // Update preferred seasons
  const updatePreferredSeasons = (seasons: string[]) => {
    setPreferences(prev => ({
      ...prev,
      preferredSeasons: seasons
    }));
  };

  // Update preferred occasions
  const updatePreferredOccasions = (occasions: string[]) => {
    setPreferences(prev => ({
      ...prev,
      preferredOccasions: occasions
    }));
  };

  // Update preferred colors
  const updatePreferredColors = (colors: string[]) => {
    setPreferences(prev => ({
      ...prev,
      preferredColors: colors
    }));
  };

  // Clear all preferences
  const clearPreferences = () => {
    setPreferences(initialPreferences);
    localStorage.removeItem('userPreferences');
  };

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      trackProductView,
      trackProductLike,
      trackProductUnlike,
      updatePreferredStyles,
      updatePreferredSeasons,
      updatePreferredOccasions,
      updatePreferredColors,
      clearPreferences
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook for using the preferences context
export const useUserPreferences = () => useContext(UserPreferencesContext);
