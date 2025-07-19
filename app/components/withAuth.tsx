import { useEffect, ComponentType, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { CircularProgress } from '@mui/material';

interface WithAuthProps {
  requireAdmin?: boolean;
  redirectTo?: string;
  showLoading?: boolean;
}

function withAuth<T extends object>(
  WrappedComponent: ComponentType<T>,
  options: WithAuthProps = {}
) {
  const { 
    requireAdmin = false, 
    redirectTo = '/login',
    showLoading = true 
  } = options;

  return function AuthenticatedComponent(props: T) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [showError, setShowError] = useState(false);

    useEffect(() => {
      // Wait for auth context to load
      if (loading) return;

      // Check if user is authenticated
      if (!user) {
        console.log('No user found, redirecting to:', redirectTo);
        setError(requireAdmin ? 'Admin authentication required' : 'Please log in to access this page');
        setShowError(true);
        
        // Redirect after showing error message
        setTimeout(() => {
          router.push(redirectTo);
        }, 2000);
        return;
      }

      // Check admin role if required
      if (requireAdmin && user.role !== 'admin') {
        console.log('Admin access required, user role:', user.role);
        setError('Admin access required');
        setShowError(true);
        
        setTimeout(() => {
          router.push('/admin/adminlogin');
        }, 2000);
        return;
      }

      // Clear any existing errors
      setError('');
      setShowError(false);
    }, [user, loading, router]);

    // Show error message if authentication failed
    if (showError && error) {
      return (
        <div className="flex justify-center items-center h-screen flex-col">
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="text-red-600 text-xl font-semibold mb-2">
              Access Denied
            </div>
            <div className="text-red-500 mb-4">{error}</div>
            <div className="text-gray-600 text-sm">
              Redirecting to login page...
            </div>
            <CircularProgress 
              size={24}
              sx={{ 
                color: 'red',
                mt: 2
              }} 
            />
          </div>
        </div>
      );
    }

    // Show loading while checking authentication
    if (loading || (!user && !showError)) {
      if (!showLoading) return null;
      
      return (
        <div className="flex justify-center items-center h-screen">
          <CircularProgress 
            sx={{ 
              color: requireAdmin ? 'orange' : 'black',
              '& .MuiCircularProgress-circle': {
                stroke: requireAdmin ? 'orange' : 'black'
              }
            }} 
          />
        </div>
      );
    }

    // Check admin role one more time before rendering
    if (requireAdmin && user && user.role !== 'admin') {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="text-red-600 text-xl font-semibold mb-2">
              Access Denied
            </div>
            <p className="text-red-500 mb-4">Admin access required</p>
            <button 
              onClick={() => router.push('/admin/adminlogin')}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      );
    }

    // User is authenticated and authorized, render the component
    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
