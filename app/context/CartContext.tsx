"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  // Add new fields for variants
  size?: string;
  color?: string;
  // Generate a unique key for each variant combination
  variantKey?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity' | 'variantKey'>) => void;
  removeFromCart: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
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

  const addToCart = (product: Omit<CartItem, 'quantity' | 'variantKey'>) => {
    setCartItems(prevItems => {
      // Generate a variant key for this product configuration
      const variantKey = generateVariantKey(product.id, product.size, product.color);
      
      // Check if this specific variant already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.variantKey === variantKey);
      
      if (existingItemIndex >= 0) {
        // This exact variant exists, increase quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // This variant doesn't exist, add new item with quantity 1
        return [...prevItems, { ...product, variantKey, quantity: 1 }];
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
