"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authNotifications } from "@/lib/notificationService";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // ✅ Login function inside the component
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      return data.user; // Return user object
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);

      if (user && user.role === "user") {
        authNotifications.loginSuccess();
        router.push("/"); // Redirect to Customer Dashboard
      } else {
        authNotifications.loginError();
      }
    } catch (error) {
      authNotifications.loginError("Invalid email or password");
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
            className={`w-full ${
              isLoading ? "bg-gray-500" : "bg-gray-900"
            } text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition`}
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
          <Link href="/forgot-password" className="font-semibold hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
