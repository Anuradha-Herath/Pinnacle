"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getValidImageUrl } from "@/lib/imageUtils";
import { trackProductAction } from "@/lib/userPreferenceService";
import { deduplicateRequest } from "@/lib/apiUtils";
import { usePathname } from "next/navigation";

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
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }, showNotification?: boolean) => void;
  removeFromCart: (id: string, size?: string, color?: string) => void;
  // clearCart: () => Promise<void>;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isLoading: boolean;
  // cartCleared: boolean;
  // resetCartCleared: () => void;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  // clearCart: async () => {},
  updateQuantity: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  isLoading: false,
  // cartCleared: false,
  // resetCartCleared: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [isClearing, setIsClearing] = useState(false);
  // const [cartCleared, setCartCleared] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  // Load cart from API/localStorage, but only if cart is not marked as cleared
  useEffect(() => {
    // if (isAdminPage || isClearing || cartCleared) return;
    if (isAdminPage) return;

    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const data: any = await deduplicateRequest("/api/user/cart");
          if (data.success && data.cart) {
            const apiCart = data.cart.map((item: any) => ({
              id: item.productId || item.id,
              name: item.name || "Product",
              price: item.price || 0,
              discountedPrice: item.discountedPrice ?? undefined,
              image: getValidImageUrl(item.image),
              size: item.size,
              color: item.color,
              quantity: item.quantity || 1,
            }));
            setCart(apiCart);
          } else {
            setCart([]);
          }
        } else {
          const savedCart = localStorage.getItem("cart");
          if (savedCart) setCart(JSON.parse(savedCart));
        }
      } catch {
        setCart([]);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    loadCart();
  }, [user, isAdminPage]);
  // [user, isClearing, cartCleared, isAdminPage]);

  // Save cart to localStorage and server (debounced), but do NOT save if cartCleared
  useEffect(() => {
    // if (!initialized || isAdminPage || isClearing || cartCleared) return;
    if (!initialized || isAdminPage) return;

    localStorage.setItem("cart", JSON.stringify(cart));

    if (user) {
      const timeoutId = setTimeout(async () => {
        try {
          const apiCart = cart.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            discountedPrice: item.discountedPrice ?? undefined,
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          }));
          await fetch("/api/user/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: apiCart }),
          });
        } catch (error) {
          console.error("Failed to sync cart:", error);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user, initialized, isAdminPage]);
  // [cart, user, initialized, isClearing, cartCleared, isAdminPage]);

  // // Call this anywhere to clear the cart
  // const clearCart = async (): Promise<void> => {
  //   console.log(" clearCart called!");
  //   try {
  //     setIsClearing(true);
  //     setIsLoading(true);
  //     setCart([]);
  //     setCartCleared(true); // suppress reloads/effects for this session
  //     localStorage.removeItem("cart");
  //     sessionStorage.removeItem("cart");

  //     if (user) {
  //       const res = await fetch("/api/user/cart", { method: "DELETE" });
  //       const result = await res.json();
  //       if (!res.ok || !result.success) {
  //         throw new Error(result.error || "DELETE failed");
  //       }
  //       console.log(" Cart successfully cleared via DELETE API.");
  //     }
  //   } catch (error) {
  //     console.error(" Failed to clear cart:", error);
  //   } finally {
  //     setIsLoading(false);
  //     setTimeout(() => setIsClearing(false), 2500);
  //   }
  // };

  // // Call this after leaving success page to re-enable cart
  // const resetCartCleared = () => setCartCleared(false);

  const addToCart = (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => {
    const quantity = item.quantity || 1;

    trackProductAction(
      {
        id: item.id,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        price: item.price,
      },
      "cart"
    );

    setCart((prev) => {
      const index = prev.findIndex(
        (i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += quantity;
        if (typeof item.discountedPrice === "number") {
          updated[index].discountedPrice = item.discountedPrice;
        }
        return updated;
      }
      return [
        ...prev,
        {
          ...item,
          image: item.image || "/placeholder.png",
          quantity,
          discountedPrice: item.discountedPrice ?? undefined,
        },
      ];
    });
  };

  const removeFromCart = (id: string, size?: string, color?: string) =>
    setCart((prev) =>
      prev.filter(
        (item) => !(item.id === id && item.size === size && item.color === color)
      )
    );

  const updateQuantity = (
    id: string,
    quantity: number,
    size?: string,
    color?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === id && item.size === size && item.color === color
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const getCartTotal = () =>
    cart.reduce((total, item) => {
      const price =
        typeof item.discountedPrice === "number" &&
        item.discountedPrice < item.price
          ? item.discountedPrice
          : item.price;
      return total + price * item.quantity;
    }, 0);

  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        //clearCart,
        updateQuantity,
        getCartTotal,
        getCartCount,
        isLoading,
        //cartCleared,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
