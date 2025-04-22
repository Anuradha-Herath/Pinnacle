"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { authNotifications } from "@/lib/notificationService";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // If this is the regular login page, set flag for admins
        if (user?.role === 'admin') {
          localStorage.setItem('adminLoginSource', 'regular');
        }
        
        authNotifications.loginSuccess();
        router.push("/"); // Redirect to home page
      } else {
        authNotifications.loginError();
      }
    } catch (error) {
      authNotifications.loginError("An error occurred during login");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-5xl font-bold mb-2">LOGIN</h1>
        <p className="text-gray-600 text-sm mb-6">
          If you have an account with us, please log in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-gray-900'} text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition`}
          >
            {isLoading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        {/* Sign-up & Forgot Password Links */}
        <p className="text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold hover:underline">
            Create an account
          </Link>{" "}
          or{" "}
          <Link
            href="/forgot-password"
            className="font-semibold hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
