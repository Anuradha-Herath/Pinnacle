"use client";

import { useEffect } from 'react';
import { suppressClientErrors } from '@/lib/logger';

const ErrorSuppressor = () => {
  useEffect(() => {
    // Initialize error suppression on client
    suppressClientErrors();
  }, []);

  // This component doesn't render anything
  return null;
};

export default ErrorSuppressor;
