"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation"; // Add useParams hook
import { authNotifications } from "@/lib/notificationService";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string; // Use the token from params

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
        {/* Title - Added negative margin to shift slightly left */}
        <h1 className="text-3xl font-bold mb-2 whitespace-nowrap ml-[-30px]">
          RESET YOUR PASSWORD
        </h1>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
            <p className="text-green-800 mb-2">Password reset successful!</p>
            <p className="text-sm text-gray-600">
              Your password has been updated. You will be redirected to the login page in a few seconds.
            </p>
            <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
              Go to login now
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-6">Enter your new password.</p>

            {/* Reset Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className="w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {/* Error Message */}
              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* Reset Password Button */}
              <button
                type="submit"
                className={`w-3/4 bg-gray-900 text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition ${
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

export default ResetPasswordPage;
