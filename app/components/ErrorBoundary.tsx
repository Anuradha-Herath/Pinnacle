'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error caught by ErrorBoundary:', error);
    return <>{fallback}</>;
  }
}
