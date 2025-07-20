"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { authNotifications } from "@/lib/notificationService";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const success = await signup(firstName, lastName, email, password);
      
      if (success) {
        authNotifications.signupSuccess();
        router.push("/"); // Redirect to home page
      } else {
        setError("Failed to create account. Email might already be in use.");
        authNotifications.signupError("Failed to create account");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred during signup");
      authNotifications.signupError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-lg text-center">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          CREATE AN ACCOUNT
        </h1>
        <p className="text-gray-600 text-xs mb-6">
          Enter your information below to proceed. If you already have an
          account, please log in instead.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 border border-black rounded-md p-6">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="First Name"
              className="w-1/2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-1/2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className={`w-full ${isLoading ? 'bg-gray-500' : 'bg-gray-900'} text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition`}
            disabled={isLoading}
          >
            {isLoading ? "CREATING ACCOUNT..." : "CREATE AN ACCOUNT"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
