"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  
  const { login, user } = useAuth();
  const router = useRouter();
  
  // Add state to handle client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Use the admin-specific endpoint instead of the regular login
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Login successful, wait a moment for cookie to be set then check auth
        setIsCheckingRole(true);
        
        // Add a small delay to ensure the cookie is set
        setTimeout(async () => {
          try {
            // Force a fresh auth check with retry mechanism
            let authSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!authSuccess && retryCount < maxRetries) {
              const authResponse = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              });
              
              if (authResponse.ok) {
                const authData = await authResponse.json();
                if (authData.success && authData.user && authData.user.role === 'admin') {
                  toast.success("Admin login successful!");
                  router.push('/admin/dashboard');
                  authSuccess = true;
                } else {
                  setError("Access denied. Admin privileges only.");
                  toast.error("Access denied. Admin privileges only.");
                  authSuccess = true; // Stop retrying for permission errors
                }
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            }
            
            if (!authSuccess) {
              setError("Authentication verification failed. Please try again.");
              toast.error("Authentication verification failed. Please try again.");
            }
          } catch (authError) {
            console.log("Auth verification error:", authError);
            setError("Authentication verification failed. Please try again.");
            toast.error("Authentication verification failed. Please try again.");
          }
          setIsCheckingRole(false);
        }, 300); // Reduced delay but added retry mechanism
      } else {
        // Handle different error cases
        if (data.accountLocked) {
          const unlockTime = new Date(data.lockUntil).toLocaleTimeString();
          setError(`Account temporarily locked. Try again after ${unlockTime}`);
          toast.error(`Account temporarily locked. Try again after ${unlockTime}`);
        } else if (data.remainingAttempts !== undefined) {
          setError(`Invalid credentials. ${data.remainingAttempts} attempts remaining before lockout.`);
          toast.error(`Invalid credentials. ${data.remainingAttempts} attempts remaining.`);
        } else {
          setError(data.error || "Invalid credentials");
          toast.error(data.error || "Invalid credentials");
        }
      }
    } catch (error) {
      setError("Authentication failed");
      toast.error("Authentication failed");
      console.log("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render the form on the client side to avoid hydration mismatches
  if (!isClient) {
    return (
      <div className="flex h-screen">
        <div className="bg-[#282C34] text-white flex items-center justify-center w-1/2">
          <h1 className="text-4xl font-semibold italic">Pinnacle</h1>
        </div>
        <div className="flex flex-col justify-center items-center w-1/2 bg-gray-100">
          <div className="w-96 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">Admin Sign in</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      {/* Left Section (Logo) */}
      <div className="bg-[#282C34] text-white flex items-center justify-center w-1/2">
        <h1 className="text-4xl font-semibold italic">Pinnacle</h1>
      </div>

      {/* Right Section (Login Form) */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-gray-100">
        <div className="w-96 p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Admin Login</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email address and password to access admin panel.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Keep me logged in
              </label>
            </div>
            <button
              type="submit"
              className={`w-full ${isLoading ? 'bg-orange-300' : 'bg-orange-500'} text-white p-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:border-orange-300`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <a 
              href="/request-reset?from=admin" 
              className="text-sm text-orange-500 hover:text-orange-600 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          
          {/* No Google login button for admin access */}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
