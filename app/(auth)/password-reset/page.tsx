"use client";

import React, { useState } from "react";
import Link from "next/link";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    // Handle password reset logic here
    console.log("Password successfully reset!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm text-center">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 whitespace-nowrap">
          RESET ACCOUNT PASSWORD
        </h1>
        <p className="text-gray-600 text-sm mb-6">Enter a new password.</p>

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            className="w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-3/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Reset Password Button */}
          <button
            type="submit"
            className="w-3/4 bg-gray-900 text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition"
          >
            RESET PASSWORD
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
