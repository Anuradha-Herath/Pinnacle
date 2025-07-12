"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  syncUserData: () => Promise<void>; // New method to explicitly sync user data
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
  syncUserData: async () => {}, // Default implementation
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  // Check authentication status on mount
  useEffect(() => {
    // For admin pages, we still need auth but can skip sync
    checkAuth();
  }, []);

  // Check for NextAuth session on component mount
  useEffect(() => {
    if (session && session.user) {
      // If we have a NextAuth session but no JWT login
      if (!user) {
        // Use the session to set our user state
        setUser({
          id: session.user.id,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
          role: session.user.role || 'user',
        });
        
        // Set loading false
        setLoading(false);
      }
    }
  }, [session, user]);
  
  // Sync user data from local storage to server on login
  const syncUserData = async (): Promise<void> => {
    try {
      if (!user) return;
      
      // Skip sync for admin pages to improve performance
      if (isAdminPage) return;
      
      // Don't sync too frequently (prevent excessive API calls)
      const now = Date.now();
      if (now - lastSyncTime < 2000) { // 2 seconds minimum between syncs
        return;
      }
      setLastSyncTime(now);

      // Get local data
      const localCart = localStorage.getItem('cart');
      const localWishlist = localStorage.getItem('wishlist');
      
      // Sync cart if exists in local storage
      if (localCart) {
        const parsedCart = JSON.parse(localCart);
        if (parsedCart && parsedCart.length > 0) {
          // Format for API
          const apiCart = parsedCart.map((item: any) => ({
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: apiCart })
          });
        }
      }
      
      // Sync wishlist if exists in local storage
      if (localWishlist) {
        const parsedWishlist = JSON.parse(localWishlist);
        if (parsedWishlist && parsedWishlist.length > 0) {
          await fetch('/api/user/wishlist', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wishlist: parsedWishlist })
          });
        }
      }
      
      console.log('User data synchronized successfully');
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'same-origin',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          // After successful authentication check, sync local data with server only for non-admin pages
          if (!isAdminPage) {
            await syncUserData();
          }
          return true;
        } else {
          setUser(null);
          return false;
        }
      } else {
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Authentication check error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Auth request timed out');
        setError('Authentication request timed out');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        
        // After successful login, sync local data with server only for non-admin pages
        if (!isAdminPage) {
          await syncUserData();
        }
        
        // REMOVE THIS TOAST - will be handled in the Login component
        // toast.success("Successfully logged in");
        
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during login';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (firstName: string, lastName: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        
        // After successful signup, sync local data with server only for non-admin pages
        if (!isAdminPage) {
          await syncUserData();
        }
        
        return true;
      } else {
        setError(data.error || 'Signup failed');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during signup';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function - preserve local data for guest mode
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Before logging out, ensure user data is synced (optional as a safeguard) only for non-admin pages
      if (user && !isAdminPage) {
        await syncUserData();
      }
      
      // Clear our JWT cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Also sign out from NextAuth
      await nextAuthSignOut({ redirect: false });
      
      // Reset state
      setUser(null);
      
      // REMOVE THIS TOAST - will be handled in the component
      // toast.success("Logged out successfully");
    } catch (err) {
      console.error('Logout error:', err);
      toast.error("Error during logout");
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    checkAuth,
    syncUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
