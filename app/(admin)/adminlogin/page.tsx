// ./app/(admin)/adminlogin/page.tsx

"use client"; // Mark as client component

import React, { useState } from "react";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Add state for rememberMe

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement your login logic here (e.g., API call)
    console.log(
      "Email:",
      email,
      "Password:",
      password,
      "Remember Me:",
      rememberMe
    );

    // Example API call (replace with your actual API endpoint)
    // fetch("/api/login", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ email, password, rememberMe }),
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     // Handle successful login (e.g., redirect to dashboard)
    //     console.log("Login successful:", data);
    //   })
    //   .catch((error) => {
    //     // Handle login error (e.g., display error message)
    //     console.error("Login error:", error);
    //   });
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
          <h2 className="text-2xl font-semibold mb-4 text-center">Sign in</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email address and password to access admin panel.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Keep me logged in
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:border-orange-300"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
