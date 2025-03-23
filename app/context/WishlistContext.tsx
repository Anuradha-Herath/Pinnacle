"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { trackProductAction } from '@/lib/userPreferenceService';

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
  isInWishlist: () => false,
});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();
  
  // Load wishlist from localStorage or API when component mounts or user changes
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (user) {
          // User is logged in, fetch wishlist from API
          const response = await fetch('/api/user/wishlist');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.wishlist) {
              setWishlist(data.wishlist);
            }
          }
        } else {
          // User is not logged in, load from localStorage
          const savedWishlist = localStorage.getItem('wishlist');
          if (savedWishlist) {
            try {
              setWishlist(JSON.parse(savedWishlist));
            } catch (e) {
              console.error('Error parsing wishlist from localStorage:', e);
              setWishlist([]);
            }
          }
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error loading wishlist:', error);
        // Fallback to localStorage in case of API error
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          try {
            setWishlist(JSON.parse(savedWishlist));
          } catch (e) {
            setWishlist([]);
          }
        }
        setInitialized(true);
      }
    };

    loadWishlist();
  }, [user]);

  // Save wishlist to localStorage and API when it changes
  useEffect(() => {
    if (!initialized) return;
    
    // Always save to localStorage (for guest users and as backup)
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // If user is logged in, also save to API
    if (user) {
      const saveWishlistToAPI = async () => {
        try {
          await fetch('/api/user/wishlist', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ wishlist }),
          });
        } catch (error) {
          console.error('Error saving wishlist to API:', error);
        }
      };
      
      saveWishlistToAPI();
    }
  }, [wishlist, user, initialized]);

  const addToWishlist = (productId: string) => {
    // Track action in userPreferenceService
    fetch(`/api/products/${productId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.product) {
          trackProductAction({
            id: productId,
            name: data.product.productName,
            category: data.product.category,
            subCategory: data.product.subCategory,
            price: data.product.regularPrice
          }, 'wishlist');
        }
      })
      .catch(err => console.error('Error fetching product for preference tracking:', err));
    
    setWishlist(prevWishlist => {
      if (!prevWishlist.includes(productId)) {
        return [...prevWishlist, productId];
      }
      return prevWishlist;
    });
    // Don't show toast from here
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prevWishlist => prevWishlist.filter(id => id !== productId));
    // Don't show toast from here
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
