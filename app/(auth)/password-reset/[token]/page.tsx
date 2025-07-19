"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { authNotifications } from "@/lib/notificationService";

const TokenResetPage = () => {
  // Get token from URL parameter
  const params = useParams();
  const token = params.token as string;
  const searchParams = useSearchParams();
  
  // Check if request is coming from admin
  const isAdminRequest = searchParams.get('from') === 'admin';
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Set isMounted to true after component mounts (prevents hydration issues)
  useEffect(() => {
    setIsMounted(true);
    console.log("Token from URL:", token);
    console.log("Is admin request:", isAdminRequest);
  }, [token]);

  // Dynamic colors based on admin request
  const colors = {
    primary: isAdminRequest ? '#ff6b35' : '#000000',
    primaryHover: isAdminRequest ? '#e55a2b' : '#333333',
    focus: isAdminRequest ? 'orange-500' : 'gray-800',
    background: isAdminRequest ? 'from-orange-50 to-white' : 'from-gray-50 to-white',
    buttonText: 'white',
    titleColor: isAdminRequest ? 'text-orange-600' : 'text-gray-900'
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true);
        authNotifications.passwordResetSuccess();
        
        // Redirect to appropriate login after 3 seconds
        setTimeout(() => {
          router.push(isAdminRequest ? '/admin/adminlogin' : '/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${colors.background}`}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${colors.titleColor}`}>
            RESET YOUR PASSWORD
          </h1>
          {isAdminRequest && (
            <div className="text-sm text-orange-600 bg-orange-50 py-2 px-4 rounded-md border border-orange-200">
              Admin Password Reset
            </div>
          )}
        </div>
        
        {!isMounted ? (
          <div className="animate-pulse h-40 flex items-center justify-center">
            <div className={`w-12 h-12 border-4 ${
              isAdminRequest ? 'border-orange-200 border-t-orange-500' : 'border-gray-300 border-t-gray-900'
            } rounded-full animate-spin`}></div>
          </div>
        ) : isSuccess ? (
          <div className={`${
            isAdminRequest ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
          } border p-6 rounded-md mb-4`}>
            <div className={`${
              isAdminRequest ? 'text-orange-800' : 'text-green-800'
            } mb-3 font-semibold`}>
              Password reset successful!
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your password has been updated. You will be redirected to the {isAdminRequest ? 'admin ' : ''}login page in a few seconds.
            </p>
            <Link 
              href={isAdminRequest ? "/admin/adminlogin" : "/login"} 
              className={`inline-block px-4 py-2 rounded-md text-white font-medium transition-colors ${
                isAdminRequest 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              Go to {isAdminRequest ? 'admin login' : 'login'} now
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 text-sm mb-6 text-center">
              Enter your new password{isAdminRequest ? ' for your admin account' : ''}.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-${colors.focus} focus:border-transparent transition-colors`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-${colors.focus} focus:border-transparent transition-colors`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                style={{ backgroundColor: colors.primary }}
                className={`w-full text-white font-semibold py-3 rounded-md transition-all duration-200 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg'
                }`}
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  }
                }}
              >
                {isLoading ? "UPDATING..." : "RESET PASSWORD"}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link 
                href={isAdminRequest ? "/admin/adminlogin" : "/login"}
                className={`text-sm ${
                  isAdminRequest ? 'text-orange-600 hover:text-orange-700' : 'text-gray-600 hover:text-gray-800'
                } hover:underline transition-colors`}
              >
                Back to {isAdminRequest ? 'admin ' : ''}login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenResetPage;
