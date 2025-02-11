"use client";

import React, { useState } from "react";
import Link from "next/link";

const LoginPage = () => {
  const [fname, setfname] = useState("");
  const [lname, setlname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>

        <form>
            {/* First Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              First Name
            </label>
            <input
              type="fname"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Enter your first name"
              value={fname}
              onChange={(e) => setfname(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Last Name
            </label>
            <input
              type="lname"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Enter your last name"
              value={lname}
              onChange={(e) => setlname(e.target.value)}
            />
          </div>

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

          {/* Password Field */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Create An Account
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
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

export default LoginPage;
