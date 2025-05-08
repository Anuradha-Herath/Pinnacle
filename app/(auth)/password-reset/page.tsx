"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authNotifications } from "@/lib/notificationService";

const RequestResetPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSubmitted(true);
        authNotifications.passwordResetSent();
      } else {
        throw new Error(data.error || 'Failed to request password reset');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      authNotifications.loginError('Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2 whitespace-nowrap ml-[-30px]">
          FORGOT YOUR PASSWORD?
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Enter your email address to receive a password reset link.
        </p>

        {isSubmitted ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
            <p className="text-green-800 mb-2">Password reset email sent!</p>
            <p className="text-sm text-gray-600">
              If your email exists in our system, you will receive a password reset link shortly.
              Please check your inbox and spam folder.
            </p>
            <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <button
              type="submit"
              className={`w-full bg-gray-900 text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
            
            <p className="text-sm text-gray-600 mt-4">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResetPage;
