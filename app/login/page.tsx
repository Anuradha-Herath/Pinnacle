"use client";

import React, { useState } from "react";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm text-center">
        {/* LOGIN Title */}
        {/*<h1 className="text-4xl font-bold mb-2">LOGIN</h1>8/}

        {/* Instruction Text */}
        <h1 className="text-5xl font-bold mb-2">LOGIN</h1>
        <p className="text-gray-600 text-sm mb-6">
          If you have an account with us, please log in.
        </p>

        <form className="space-y-4">
            {/* Email Input */}
            <style jsx>{`
            input[type="email"],
            input[type="password"] {
              width: 100%;
            }
            h1, p, a {
              color: #333;
            }
            `}</style>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Sign In Button */}
            <button
            type="submit"
            className="w-full bg-gray-900 text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition"
            >
            SIGN IN
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
