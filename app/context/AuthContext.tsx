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
  refreshUser: () => Promise<void>; // Method to force refresh user data
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
  refreshUser: async () => {}, // Default implementation
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasInitialSync, setHasInitialSync] = useState<boolean>(false); // Track initial sync
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin');

  // Check authentication status on mount - only once
  useEffect(() => {
    let mounted = true;
    const doInitialAuthCheck = async () => {
      if (mounted && !isSyncing) {
        await checkAuth();
      }
    };
    
    // For admin pages, we still need auth but can skip sync
    doInitialAuthCheck();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Effect to sync NextAuth session with Auth context
  useEffect(() => {
    const syncNextAuthSession = async () => {
      // Prevent multiple concurrent sync operations
      if (isSyncing) return;
      
      if (sessionStatus === 'authenticated' && session?.user) {
        console.log('NextAuth session detected, syncing with Auth context', session.user);
        
        // Check if we already have user data with the same email to avoid unnecessary syncs
        if (user && user.email === session.user.email) {
          setLoading(false);
          return;
        }
        
        setIsSyncing(true);
        
        // Clear any existing user data first to prevent stale data
        setUser(null);
        setLoading(true);
        
        // Always fetch fresh user data from database for Google logins
        // to ensure we have the latest information
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            credentials: 'same-origin',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              console.log('Successfully fetched fresh user data:', data.user);
              setUser(data.user);
              setLoading(false);
              setIsSyncing(false);
              return;
            }
          }
        } catch (error) {
          console.log('Error fetching fresh user data:', error);
        }
        
        // Fallback: Set user state from NextAuth session data
        setUser({
          id: session.user.id || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
          role: session.user.role || 'user',
        });
        
        setLoading(false);
        setIsSyncing(false);
      } else if (sessionStatus === 'unauthenticated') {
        // Clear user state when session is unauthenticated
        console.log('NextAuth session unauthenticated, clearing user state');
        setUser(null);
        setLoading(false);
        setIsSyncing(false);
      }
    };
    
    syncNextAuthSession();
  }, [session?.user?.email, sessionStatus]); // Only depend on email and session status
  
  // Sync user data from local storage to server on login
  const syncUserData = async (): Promise<void> => {
    try {
      if (!user) return;
      
      // Skip sync for admin pages to improve performance
      if (isAdminPage) return;
      
      // If initial sync is already completed, skip frequent syncs
      if (hasInitialSync) return;
      
      // Don't sync too frequently (prevent excessive API calls)
      const now = Date.now();
      if (now - lastSyncTime < 5000) { // 5 seconds minimum between syncs
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
      setHasInitialSync(true); // Mark initial sync as complete
    } catch (error) {
      console.log('Error syncing user data:', error);
    }
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    // Prevent multiple concurrent auth checks
    if (isSyncing) return user !== null;
    
    // If we already have a user and we're on a profile page, skip auth check
    if (user && pathname.includes('/profilepage')) {
      return true;
    }
    
    setIsSyncing(true);
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60', // Cache for 1 minute
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
      // Only log errors, don't set them in state unless critical
      console.log('Authentication check warning:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Auth request timed out - continuing with existing state');
        // Don't set error for timeout on profile page
        if (!pathname.includes('/profilepage')) {
          setError('Authentication request timed out');
        }
      } else {
        // Only set error for non-profile pages
        if (!pathname.includes('/profilepage')) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
        }
      }
      
      // If we're on profile page and have existing user, keep them
      if (pathname.includes('/profilepage') && user) {
        return true;
      }
      
      setUser(null);
      return false;
    } finally {
      setLoading(false);
      setIsSyncing(false);
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
        setHasInitialSync(false); // Reset sync flag for new user
        
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
        setHasInitialSync(false); // Reset sync flag for new user
        
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
      
      // Reset state immediately and force a hard reset
      setUser(null);
      setHasInitialSync(false); // Reset sync flag on logout
      setError(null);
      setLoading(false);
      
      // Force a small delay to ensure state is properly cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // REMOVE THIS TOAST - will be handled in the component
      // toast.success("Logged out successfully");
    } catch (err) {
      console.log('Logout error:', err);
      toast.error("Error during logout");
    } finally {
      setLoading(false);
    }
  };

  // Force refresh user data from the server
  const refreshUser = async (): Promise<void> => {
    // Prevent multiple concurrent refresh operations
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'same-origin',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('User data refreshed successfully:', data.user);
          setUser(data.user);
        }
      }
    } catch (error) {
      console.log('Error refreshing user data:', error);
    } finally {
      setIsSyncing(false);
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
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
