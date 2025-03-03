"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// Define types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, showNotification?: boolean) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();
  
  // Load cart from localStorage or API when component mounts or user changes
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (user) {
          // User is logged in, fetch cart from API
          const response = await fetch('/api/user/cart');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.cart) {
              // Convert API cart format to our CartItem format
              const apiCart = data.cart.map((item: any) => ({
                id: item.productId,
                name: item.name || "Product", // Fallback if name isn't stored
                price: item.price || 0,
                image: item.image || "/placeholder.png",
                size: item.size,
                color: item.color,
                quantity: item.quantity,
              }));
              setCart(apiCart);
            }
          }
        } else {
          // User is not logged in, load from localStorage
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
        setInitialized(true);
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
        setInitialized(true);
      }
    };

    loadCart();
  }, [user]);

  // Save cart to localStorage and API when it changes
  useEffect(() => {
    if (!initialized) return;
    
    // Always save to localStorage (for guest users and as backup)
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // If user is logged in, also save to API
    if (user) {
      const saveCartToAPI = async () => {
        try {
          // Convert CartItem to API format
          const apiCart = cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          }));

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
      };
      
      saveCartToAPI();
    }
  }, [cart, user, initialized]);

  // Cart operations
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, showNotification: boolean = true) => {
    setCart(prevCart => {
      // Check if item already exists in cart with same ID, size, and color
      const itemQuantity = item.quantity || 1;
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
        // Item doesn't exist, add new item
        return [...prevCart, { ...item, quantity: itemQuantity }];
      }
    });
    
    // Don't show toast from here - let components handle this
    // This prevents duplicate toast notifications
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.id === id && item.size === size && item.color === color)
      )
    );
    // Don't show toast from here
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      removeFromCart(id, size, color);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
