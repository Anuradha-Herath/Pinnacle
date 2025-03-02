"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  variantKey?: string;
}

interface AddToCartParams {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity?: number; // Make quantity optional in the params
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: AddToCartParams) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Helper function to generate a unique key for each variant
  const generateVariantKey = (id: string, size?: string, color?: string): string => {
    return `${id}_${size || 'default'}_${color || 'default'}`;
  };

  const addToCart = (product: AddToCartParams) => {
    setCartItems(prevItems => {
      // Generate a variant key for this product configuration
      const variantKey = generateVariantKey(product.id, product.size, product.color);
      
      // Use provided quantity or default to 1
      const itemQuantity = product.quantity || 1;
      
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(item => 
        item.variantKey === variantKey || 
        (item.id === product.id && 
         item.size === product.size && 
         item.color === product.color)
      );
      
      if (existingItemIndex >= 0) {
        // Item exists, increase quantity by the specified amount
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + itemQuantity
        };
        return updatedItems;
      } else {
        // Item doesn't exist, add new item with specified quantity
        return [...prevItems, { 
          ...product, 
          variantKey, 
          quantity: itemQuantity 
        }];
      }
    });
  };

  const removeFromCart = (variantKey: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.variantKey !== variantKey));
  };

  const updateQuantity = (variantKey: string, quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.variantKey === variantKey ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
