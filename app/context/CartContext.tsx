"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { getValidImageUrl } from "@/lib/imageUtils"; 
import { trackProductAction } from '@/lib/userPreferenceService';

// Define types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number; 
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string;
  subCategory?: string;
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, showNotification?: boolean) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  clearCart: () => Promise<void>;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: async () => {},
  updateQuantity: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  isLoading: false,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false); // New flag to track clearing state
  const { user } = useAuth();
  
  // Load cart from localStorage or API when component mounts or user changes
  useEffect(() => {
    // Don't reload cart if we're in the process of clearing it
    if (isClearing) {
      console.log("Skipping cart reload because cart is being cleared");
      return;
    }
    
    const loadCart = async () => {
      try {
        setIsLoading(true);
        if (user) {
          // User is logged in, fetch cart from API
          console.log("Fetching cart from server for user:", user.id);
          const response = await fetch('/api/user/cart');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.cart) {
              console.log("Successfully loaded cart from server with", data.cart.length, "items");
              // Convert API cart format to our CartItem format with validated images
              const apiCart = data.cart.map((item: any) => ({
                id: item.productId,
                name: item.name || "Product", // Fallback if name isn't stored
                price: item.price || 0,
                image: getValidImageUrl(item.image), // Validate image URL
                size: item.size,
                color: item.color,
                quantity: item.quantity,
              }));
              setCart(apiCart);
            }
          } else {
            console.log("Failed to load cart from server:", response.status);
          }
        } else {
          // User is not logged in, load from localStorage
          console.log("Loading cart from localStorage (not logged in)");
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              setCart(JSON.parse(savedCart));
            } catch (e) {
              console.error('Error parsing cart from localStorage:', e);
              setCart([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to localStorage in case of API error
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {
            setCart([]);
          }
        }
      } finally {
        setInitialized(true);
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user, isClearing]);

  // Save cart to localStorage and API when it changes - DEBOUNCED
  useEffect(() => {
    if (!initialized) return;
    
    // Always save to localStorage (for guest users and as backup)
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // If user is logged in, also save to API with debouncing
    if (user) {
      // Debounce API calls to prevent excessive requests
      const timeoutId = setTimeout(async () => {
        try {
          // Ensure all required fields are included when sending to API
          const apiCart = cart.map(item => ({
            productId: item.id,
            name: item.name || "Product", // Ensure name is present
            price: item.price || 0,       // Ensure price is present
            image: item.image || "/placeholder.png", // Ensure image is present
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          }));

          console.log(`Saving cart to API (debounced): ${apiCart.length} items`);
          await fetch('/api/user/cart', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart: apiCart }),
          });
        } catch (error) {
          console.error('Error saving cart to API:', error);
        }
      }, 500); // 500ms debounce delay

      return () => clearTimeout(timeoutId);
    }
  }, [cart, user, initialized]);

  // Helper function to generate a unique key for cart items
  const getItemKey = (id: string, size?: string, color?: string): string => {
    return `${id}${size ? `-${size}` : ''}${color ? `-${color}` : ''}`;
  };

  // Improved helper function for debugging
  const logCartOperation = (operation: string, details: any) => {
    console.log(`Cart operation: ${operation}`, details);
  };

  // Improved function to get a better color representation
  const getDisplayColor = (color: string | undefined): string | undefined => {
    if (!color) return undefined;
    
    // If color is a URL (likely when the color is stored as an image path)
    if (color.startsWith('http') || color.startsWith('/')) {
      // Extract just the filename for simplicity
      const parts = color.split('/');
      return parts[parts.length - 1].split('.')[0];
    }
    
    return color;
  };

  // Cart operations
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, showNotification: boolean = true) => {
    const itemQuantity = item.quantity || 1;
    
    // Extract a display-friendly color if it's a URL
    const displayColor = getDisplayColor(item.color);
    
    logCartOperation('addToCart', {
      id: item.id, 
      color: item.color,
      displayColor,
      size: item.size,
      quantity: itemQuantity,
      price: item.price,
      discountedPrice: item.discountedPrice
    });
    
    // Track this action for personalization
    trackProductAction({
      id: item.id,
      name: item.name,
      category: item.category,
      subCategory: item.subCategory,
      price: item.price
    }, 'cart');

    setCart(prevCart => {
      // Check if item already exists in cart with same ID, size, and color
      const existingItemIndex = prevCart.findIndex(
        cartItem => 
          cartItem.id === item.id && 
          cartItem.size === item.size && 
          cartItem.color === item.color
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += itemQuantity;
        return updatedCart;
      } else {
        // Item doesn't exist, add new item with valid image
        const newItem = {
          ...item,
          image: item.image || "/placeholder.png",
          colorDisplay: displayColor, // Add a display-friendly color name
          quantity: itemQuantity
        };
        return [...prevCart, newItem];
      }
    });
    
    // Toast is handled by the component
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    logCartOperation('removeFromCart', {id, size, color});
    
    setCart(prevCart => {
      // Log current cart before removal
      console.log("Current cart before removal:", JSON.stringify(prevCart.map(i => ({
        id: i.id, 
        size: i.size, 
        color: i.color,
        name: i.name
      }))));
      
      // Find exact match for deletion
      const updatedCart = prevCart.filter(item => {
        const itemMatches = 
          item.id === id && 
          item.size === size && 
          item.color === color;
        
        // Log each comparison for debugging
        if (item.id === id) {
          console.log(`Comparing item: ${item.name}, id matches, size: ${item.size}=${size}, color: ${item.color}=${color}, match=${!itemMatches}`);
        }
        
        return !itemMatches;
      });
      
      console.log(`Previous cart length: ${prevCart.length}, Updated cart length: ${updatedCart.length}`);
      
      return updatedCart;
    });
  };

  const clearCart = async (): Promise<void> => {
    try {
      console.log("Starting cart clearing process...");
      setIsClearing(true); // Set flag to prevent reload during clearing
      setIsLoading(true);
      
      // Clear local state first
      setCart([]);
      
      // Always clear localStorage
      localStorage.removeItem('cart');
      console.log("Cleared cart from localStorage");
      
      // For logged-in users, explicitly clear the cart on the server
      if (user) {
        console.log("Clearing cart on server for user:", user.id);
        try {
          const response = await fetch('/api/user/cart', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart: [] }),
          });
          
          if (!response.ok) {
            console.error('Failed to clear cart on server:', await response.text());
            throw new Error('Failed to clear cart on server');
          } else {
            console.log('Cart successfully cleared on server');
          }
        } catch (error) {
          console.error('Error clearing cart on server:', error);
          throw error; // Re-throw to be caught by the outer try-catch
        }
      }
      
      console.log("Cart clearing completed successfully");
      return Promise.resolve();
    } catch (error) {
      console.error("Cart clearing failed:", error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
      // Keep isClearing true for a short duration to prevent immediate reload
      setTimeout(() => {
        setIsClearing(false);
      }, 2000); // 2-second delay before allowing reload
    }
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    logCartOperation('updateQuantity', {id, quantity, size, color});
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      removeFromCart(id, size, color);
      return;
    }
    
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        // Check for exact match
        if (item.id === id && item.size === size && item.color === color) {
          return { ...item, quantity };
        }
        return item;
      });
      return updatedCart;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // Use discounted price if available, otherwise use regular price
      const priceToUse = item.discountedPrice !== undefined ? item.discountedPrice : item.price;
      return total + (priceToUse * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
