"use client";

import { usePathname } from 'next/navigation';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import ChatbotWrapper from './ChatbotWrapper';

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export default function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // For admin routes, don't load Cart and Wishlist providers
  if (isAdminRoute) {
    return (
      <>
        {children}
        {/* Don't load chatbot on admin pages either */}
      </>
    );
  }

  // For user routes, load all providers
  return (
    <WishlistProvider>
      <CartProvider>
        {children}
        <ChatbotWrapper />
      </CartProvider>
    </WishlistProvider>
  );
}
