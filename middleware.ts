import type { NextRequest } from 'next/server';
import { routeProtectionMiddleware, middlewareConfig } from './middleware/routeProtection';

// Export the main middleware function
export function middleware(request: NextRequest) {
  return routeProtectionMiddleware(request);
}

// Export the config
export const config = middlewareConfig;
