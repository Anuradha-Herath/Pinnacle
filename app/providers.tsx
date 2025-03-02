"use client";

import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <CartProvider>
        {children}
        <Toaster position="bottom-right" />
      </CartProvider>
    </WishlistProvider>
  );
}
