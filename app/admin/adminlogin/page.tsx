"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Email verification states
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEnteredCode, setUserEnteredCode] = useState("");
  const [verificationTimer, setVerificationTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  
  // Add state to handle client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Timer effect for verification code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerificationStep && verificationTimer > 0) {
      interval = setInterval(() => {
        setVerificationTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVerificationStep, verificationTimer]);

  // Generate 4-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Send verification code to admin's email
  const sendVerificationCode = async (email: string) => {
    const code = generateVerificationCode();
    setVerificationCode(code);
    setVerificationTimer(60);
    
    try {
      const response = await fetch('/api/admin/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success("Verification code sent to your email!");
      } else {
        toast.error("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      console.log("Error sending verification code:", error);
      toast.error("Failed to send verification code. Please try again.");
    }
  };

  // Verify the entered code
  const verifyCode = (): boolean => {
    if (!verificationCode || !userEnteredCode) return false;
    if (verificationTimer <= 0) return false;
    return verificationCode === userEnteredCode;
  };

  // Handle verification form submission
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userEnteredCode.length !== 4) {
      setError("Please enter a 4-digit verification code");
      return;
    }

    if (verificationTimer <= 0) {
      setError("Verification code has expired. Please request a new one.");
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Add a small delay to ensure the loading indicator is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isValid = verifyCode();
      
      if (isValid) {
        console.log('Verification successful, redirecting to dashboard');
        // Add another small delay before navigation to show success state
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/admin/dashboard');
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.log('Error during verification:', error);
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend verification code
  const resendVerificationCode = async () => {
    if (!adminEmail) return;
    
    try {
      const newCode = generateVerificationCode();
      setVerificationCode(newCode);
      setUserEnteredCode('');
      setVerificationTimer(60);
      setError('');
      
      await sendVerificationCode(adminEmail);
      console.log('Verification code resent successfully');
    } catch (error) {
      console.log('Error resending verification code:', error);
      setError("Failed to resend verification code. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Use the admin-specific endpoint instead of the regular login
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Login successful, wait a moment for cookie to be set then check auth
        setIsCheckingRole(true);
        
        // Add a small delay to ensure the cookie is set
        setTimeout(async () => {
          try {
            // Force a fresh auth check with retry mechanism
            let authSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!authSuccess && retryCount < maxRetries) {
              const authResponse = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              });
              
              if (authResponse.ok) {
                const authData = await authResponse.json();
                if (authData.success && authData.user && authData.user.role === 'admin') {
                  // Instead of direct dashboard redirect, trigger email verification
                  setAdminEmail(authData.user.email);
                  await sendVerificationCode(authData.user.email);
                  setIsVerificationStep(true);
                  setIsCheckingRole(false);
                  authSuccess = true;
                } else {
                  setError("Access denied. Admin privileges only.");
                  toast.error("Access denied. Admin privileges only.");
                  authSuccess = true; // Stop retrying for permission errors
                }
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }
            }
            
            if (!authSuccess) {
              setError("Authentication verification failed. Please try again.");
              toast.error("Authentication verification failed. Please try again.");
            }
          } catch (authError) {
            console.log("Auth verification error:", authError);
            setError("Authentication verification failed. Please try again.");
            toast.error("Authentication verification failed. Please try again.");
          }
          setIsCheckingRole(false);
        }, 300); // Reduced delay but added retry mechanism
      } else {
        // Handle error cases - simplified since no more account locking
        setError(data.error || "Invalid credentials");
        toast.error(data.error || "Invalid credentials");
      }
    } catch (error) {
      setError("Authentication failed");
      toast.error("Authentication failed");
      console.log("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Error display component for URL errors
  const renderUrlErrorMessage = () => {
    if (!urlError) return null;
    
    let errorMessage = "An error occurred. Please try again.";
    
    if (urlError === 'Authentication required to access admin area') {
      errorMessage = "You need to log in to access the admin area.";
    } else if (urlError === 'Admin privileges required') {
      errorMessage = "Admin privileges are required to access that page.";
    } else if (urlError === 'Session expired. Please log in again') {
      errorMessage = "Your admin session has expired. Please log in again.";
    } else if (urlError.length > 5) {
      // If it's a custom error message from middleware, use it directly
      errorMessage = urlError;
    }
    
    return (
      <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 border border-red-300">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
          {errorMessage}
        </div>
      </div>
    );
  };

  // Only render the form on the client side to avoid hydration mismatches
  if (!isClient) {
    return (
      <div className="flex h-screen">
        <div className="bg-[#282C34] text-white flex items-center justify-center w-1/2">
          <h1 className="text-4xl font-semibold italic">Pinnacle</h1>
        </div>
        <div className="flex flex-col justify-center items-center w-1/2 bg-gray-100">
          <div className="w-96 p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">Admin Sign in</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      {/* Left Section (Logo) */}
      <div className="bg-[#282C34] text-white flex items-center justify-center w-1/2">
        <h1 className="text-6xl font-semibold italic">Pinnacle</h1>
      </div>

      {/* Right Section (Login Form or Verification Form) */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-gray-100">
        <div className="w-96 p-8 bg-white rounded-lg shadow-md">
          {!isVerificationStep ? (
            // Login Form
            <>
              <h2 className="text-2xl font-semibold mb-4 text-center">Admin Login</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Enter your email address and password to access admin panel.
              </p>

              {/* Display URL error messages */}
              {renderUrlErrorMessage()}

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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isLoading}
                    required
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
                  className={`w-full ${isLoading ? 'bg-orange-300' : 'bg-orange-500'} text-white p-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring focus:border-orange-300 flex items-center justify-center gap-2`}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              
              {/* Forgot Password Link */}
              <div className="mt-4 text-center">
                <a 
                  href="/request-reset?from=admin" 
                  className="text-sm text-orange-500 hover:text-orange-600 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            </>
          ) : (
            // Verification Form
            <>
              <h2 className="text-2xl font-semibold mb-4 text-center">Email Verification</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                We've sent a 4-digit verification code to {adminEmail}. Please enter it below.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={userEnteredCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setUserEnteredCode(value);
                    }}
                    className="w-full p-2 text-center text-2xl tracking-widest border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isVerifying}
                    required
                    maxLength={4}
                    autoFocus
                  />
                </div>
                
                <div className="text-center">
                  {verificationTimer > 0 ? (
                    <p className="text-sm text-gray-600">
                      Code expires in: <span className="font-semibold text-orange-500">{verificationTimer}s</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 font-semibold">
                      Code has expired
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full ${isVerifying || verificationTimer <= 0 ? 'bg-orange-300' : 'bg-orange-500'} text-white p-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:border-transparent flex items-center justify-center gap-2`}
                  disabled={isVerifying || verificationTimer <= 0 || userEnteredCode.length !== 4}
                >
                  {isVerifying && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </button>
              </form>
              
              {/* Resend Code Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={resendVerificationCode}
                  className="text-sm text-orange-500 hover:text-orange-600 hover:underline focus:outline-none"
                  disabled={verificationTimer > 0}
                >
                  {verificationTimer > 0 ? "Resend code (wait)" : "Resend verification code"}
                </button>
              </div>

              {/* Back to Login Button */}
              <div className="mt-2 text-center">
                <button
                  onClick={() => {
                    setIsVerificationStep(false);
                    setError('');
                    setUserEnteredCode('');
                    setVerificationCode('');
                    setVerificationTimer(60);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline focus:outline-none"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
