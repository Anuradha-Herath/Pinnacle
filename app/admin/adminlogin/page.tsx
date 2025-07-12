"use client";

import React, { useState, useEffect } from "react";
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
  
  // Check user state changes to handle navigation
  useEffect(() => {
    if (user && isCheckingRole) {
      setIsCheckingRole(false);
      
      if (user.role === 'admin') {
        toast.success("Admin login successful!");
        router.push('/admin/dashboard');
      } else {
        setError("Access denied. Admin privileges only.");
        toast.error("Access denied. Admin privileges only.");
        // You might want to add logout functionality here
      }
    }
  }, [user, router, isCheckingRole]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Directly attempt the login without checking if user exists first
      const success = await login(email, password);
      
      if (success) {
        // Login successful, let the useEffect handle admin check
        setIsCheckingRole(true);
      } else {
        // Login failed
        setError("Invalid credentials");
        toast.error("Invalid credentials");
      }
    } catch (error) {
      setError("Authentication failed");
      toast.error("Authentication failed");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Section (Logo) */}
      <div className="bg-[#282C34] text-white flex items-center justify-center w-1/2">
        <h1 className="text-4xl font-semibold italic">Pinnacle</h1>
      </div>

      {/* Right Section (Login Form) */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-gray-100">
        <div className="w-96 p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center">Admin Sign in</h2>
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
          
          {/* No Google login button for admin access */}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
