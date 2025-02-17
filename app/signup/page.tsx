"use client";

import React, { useState } from "react";
import Link from "next/link";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-lg text-center">
        {/* Title */}

        {/* Title with custom font */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          CREATE AN ACCOUNT
        </h1>
        {/* Instruction Text */}
        <p className="text-gray-600 text-xs mb-6">
          Enter your information below to proceed. If you already have an
          account, please log in instead.
        </p>

        {/* Form */}
        <form className="space-y-4">
          {/* Name Fields */}
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="First Name"
              className="w-1/2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-1/2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email Field */}
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password Field */}
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-semibold py-2 rounded-full hover:bg-gray-800 transition"
          >
            CREATE AN ACCOUNT
          </button>
        </form>

        {/* Login Link */}
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
