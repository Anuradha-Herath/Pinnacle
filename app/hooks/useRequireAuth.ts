import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface UseRequireAuthOptions {
  requireAdmin?: boolean;
  redirectTo?: string;
  showError?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { 
    requireAdmin = false, 
    redirectTo = '/login', 
    showError = true 
  } = options;
  
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // Reset error
    setError('');

    // Wait for auth context to load
    if (loading) {
      setIsAuthorized(false);
      return;
    }

    // Check if user is authenticated
    if (!user) {
      if (showError) {
        setError('Please log in to access this page');
      }
      const delay = showError ? 1500 : 0;
      setTimeout(() => {
        router.push(redirectTo);
      }, delay);
      setIsAuthorized(false);
      return;
    }

    // Check admin role if required
    if (requireAdmin && user.role !== 'admin') {
      if (showError) {
        setError('Admin access required');
      }
      const delay = showError ? 1500 : 0;
      setTimeout(() => {
        router.push('/admin/adminlogin');
      }, delay);
      setIsAuthorized(false);
      return;
    }

    // User is authorized
    setIsAuthorized(true);
  }, [user, loading, router, requireAdmin, redirectTo, showError]);

  return {
    user,
    loading,
    error,
    isAuthorized
  };
}

export default useRequireAuth;
