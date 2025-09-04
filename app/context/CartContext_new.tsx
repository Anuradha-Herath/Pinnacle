"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { usePathname } from 'next/navigation';

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
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  // Load cart from localStorage when component mounts
  useEffect(() => {
    if (isAdminPage) {
      setInitialized(true);
      return;
    }
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart items and ensure price/quantity are numbers
        const validatedCart = parsedCart.map((item: any) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : 0,
          discountedPrice: typeof item.discountedPrice === 'number' ? item.discountedPrice : undefined,
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        }));
        setCart(validatedCart);
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
        setCart([]);
      }
    }
    setInitialized(true);
  }, [isAdminPage]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (!initialized || isAdminPage) return;
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, initialized, isAdminPage]);

  // Cart operations
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, showNotification: boolean = true) => {
    const itemQuantity = item.quantity || 1;

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        cartItem => 
          cartItem.id === item.id && 
          cartItem.size === item.size && 
          cartItem.color === item.color
      );
      
      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += itemQuantity;
        return updatedCart;
      } else {
        const newItem: CartItem = {
          id: item.id,
          name: item.name || 'Unknown Product',
          price: typeof item.price === 'number' ? item.price : 0,
          discountedPrice: typeof item.discountedPrice === 'number' ? item.discountedPrice : undefined,
          image: item.image || "/placeholder.png",
          size: item.size,
          color: item.color,
          quantity: itemQuantity,
          category: item.category,
          subCategory: item.subCategory
        };
        return [...prevCart, newItem];
      }
    });
    
    if (showNotification) {
      toast.success(`${item.name || 'Product'} added to cart!`);
    }
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart(prevCart => {
      return prevCart.filter(item => {
        const itemMatches = 
          item.id === id && 
          item.size === size && 
          item.color === color;
        return !itemMatches;
      });
    });
  };

  const clearCart = async (): Promise<void> => {
    setCart([]);
    localStorage.removeItem('cart');
    return Promise.resolve();
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id && item.size === size && item.color === color) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const priceToUse = (item.discountedPrice !== undefined && item.discountedPrice !== null) 
        ? item.discountedPrice 
        : (item.price || 0);
      return total + (priceToUse * (item.quantity || 0));
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + (item.quantity || 0), 0);
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
