'use client';

import React, { Suspense } from 'react';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Default loading fallback component
function DefaultLoadingFallback() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
        <p className="mt-2">Loading...</p>
      </div>
    </div>
  );
}

/**
 * SuspenseWrapper component to wrap client components that use useSearchParams or other hooks
 * that require Suspense boundaries in Next.js
 * 
 * Usage:
 * <SuspenseWrapper>
 *   <YourComponentThatUsesClientHooks />
 * </SuspenseWrapper>
 */
export default function SuspenseWrapper({ 
  children, 
  fallback = <DefaultLoadingFallback /> 
}: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
