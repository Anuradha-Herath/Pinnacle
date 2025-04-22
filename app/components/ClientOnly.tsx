"use client";

import { useEffect, useState, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// This component ensures its children only render on the client side
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted state on client-side only
    setIsMounted(true);
  }, []);

  // Critical: Return null during server-side rendering to avoid hydration issues
  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
