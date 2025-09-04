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
  }, [token]);

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
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2 whitespace-nowrap ml-[-30px]">
          RESET YOUR PASSWORD
        </h1>
        
        {!isMounted ? (
          <div className="animate-pulse h-40 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : isSuccess ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
            <p className="text-green-800 mb-2">Password reset successful!</p>
            <p className="text-sm text-gray-600">
              Your password has been updated. You will be redirected to the login page in a few seconds.
            </p>
            <Link 
              href={isAdminRequest ? "/admin/adminlogin" : "/login"} 
              className={`mt-4 inline-block ${
                isAdminRequest ? 'text-orange-600 hover:text-orange-700' : 'text-blue-600'
              } hover:underline`}
            >
              Go to {isAdminRequest ? 'admin login' : 'login'} now
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-6">Enter your new password.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className={`w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  isAdminRequest ? 'focus:ring-orange-500' : 'focus:ring-gray-800'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                className={`w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  isAdminRequest ? 'focus:ring-orange-500' : 'focus:ring-gray-800'
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className={`w-3/4 ${
                  isAdminRequest 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-gray-900 hover:bg-gray-800'
                } text-white font-semibold py-2 rounded-full transition ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? "UPDATING..." : "RESET PASSWORD"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TokenResetPage;
