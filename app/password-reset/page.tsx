"use client";

import React, { useState } from "react";
import Link from "next/link";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Forgot Password
        </h2>
        <p className="text-gray-600 text-center mb-4">
          Enter your email and we will send you a password reset link.
        </p>

        <form>
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Send Reset Link
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-center text-gray-600 mt-4">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-gray-800 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
