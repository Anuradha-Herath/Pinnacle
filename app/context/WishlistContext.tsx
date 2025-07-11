"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { trackProductAction } from '@/lib/userPreferenceService';
import { deduplicateRequest } from '@/lib/apiUtils';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  
  // Check if we're on an admin page - avoid wishlist loading for admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Load wishlist from localStorage or API when component mounts or user changes
  useEffect(() => {
    // Skip wishlist loading for admin pages to improve performance
    if (isAdminPage) {
      setInitialized(true);
      return;
    }
    const loadWishlist = async () => {
      try {
        if (user) {
          // User is logged in, fetch wishlist from API with deduplication
          try {
            const data: any = await deduplicateRequest('/api/user/wishlist');
            if (data.success && data.wishlist) {
              // Filter out any null/undefined values from the server response
              const cleanWishlist = data.wishlist.filter((id: any) => id && typeof id === 'string');
              setWishlist(cleanWishlist);
            } else {
              setWishlist([]);
            }
          } catch (error) {
            console.error("Failed to load wishlist from server:", error);
            // Fallback to localStorage on API error
            const savedWishlist = localStorage.getItem('wishlist');
            if (savedWishlist) {
              try {
                const parsedWishlist = JSON.parse(savedWishlist);
                // Filter out any null/undefined values from localStorage
                const cleanWishlist = Array.isArray(parsedWishlist) 
                  ? parsedWishlist.filter((id: any) => id && typeof id === 'string')
                  : [];
                setWishlist(cleanWishlist);
              } catch (e) {
                setWishlist([]);
              }
            }
          }
        } else {
          // User is not logged in, load from localStorage
          const savedWishlist = localStorage.getItem('wishlist');
          if (savedWishlist) {
            try {
              const parsedWishlist = JSON.parse(savedWishlist);
              // Filter out any null/undefined values from localStorage
              const cleanWishlist = Array.isArray(parsedWishlist) 
                ? parsedWishlist.filter((id: any) => id && typeof id === 'string')
                : [];
              setWishlist(cleanWishlist);
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
            const parsedWishlist = JSON.parse(savedWishlist);
            // Filter out any null/undefined values from localStorage
            const cleanWishlist = Array.isArray(parsedWishlist) 
              ? parsedWishlist.filter((id: any) => id && typeof id === 'string')
              : [];
            setWishlist(cleanWishlist);
          } catch (e) {
            setWishlist([]);
          }
        }
        setInitialized(true);
      }
    };

    loadWishlist();
  }, [user, isAdminPage]);

  // Save wishlist to localStorage and API when it changes - DEBOUNCED
  useEffect(() => {
    if (!initialized) return;
    
    // Skip API calls for admin pages
    if (isAdminPage) return;
    
    // Filter out any null/undefined values before saving
    const cleanWishlist = wishlist.filter(id => id && typeof id === 'string');
    
    // Only proceed if we have a meaningful change
    const currentWishlistString = JSON.stringify(cleanWishlist.sort());
    const savedWishlistString = localStorage.getItem('wishlist');
    const savedWishlist = savedWishlistString ? JSON.parse(savedWishlistString) : [];
    const savedWishlistStringNormalized = JSON.stringify(savedWishlist.sort());
    
    // Skip if no actual change in content
    if (currentWishlistString === savedWishlistStringNormalized) {
      return;
    }
    
    // Always save to localStorage (for guest users and as backup)
    localStorage.setItem('wishlist', JSON.stringify(cleanWishlist));
    
    // If user is logged in, also save to API with debouncing
    if (user) {
      // Debounce API calls to prevent excessive requests
      const timeoutId = setTimeout(async () => {
        try {
          console.log(`Saving wishlist to API (debounced): ${cleanWishlist.length} items`);
          await fetch('/api/user/wishlist', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ wishlist: cleanWishlist }),
          });
        } catch (error) {
          console.error('Error saving wishlist to API:', error);
        }
      }, 500); // 500ms debounce delay

      return () => clearTimeout(timeoutId);
    }
  }, [wishlist, user, initialized, isAdminPage]);

  const addToWishlist = (productId: string) => {
    // Validate productId before adding
    if (!productId || typeof productId !== 'string') {
      console.error('Invalid product ID provided to addToWishlist:', productId);
      return;
    }

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
      // Filter out any null/undefined values and ensure no duplicates
      const cleanWishlist = prevWishlist.filter(id => id && typeof id === 'string');
      if (!cleanWishlist.includes(productId)) {
        return [...cleanWishlist, productId];
      }
      return cleanWishlist;
    });
    // Don't show toast from here
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prevWishlist => {
      // Filter out the specific productId and any null/undefined values
      return prevWishlist.filter(id => id && id !== productId && typeof id === 'string');
    });
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
