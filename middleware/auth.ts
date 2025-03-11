import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Types for authentication result
export interface AuthResult {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
}

// Authenticate user from JWT token in cookies/headers
export async function authenticateUser(req: NextRequest): Promise<AuthResult> {
  try {
    // Check for token in cookies first (client-side usage)
    let token = req.cookies.get('token')?.value;

    // If no token in cookies, check authorization header (API usage)
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token found, user is not authenticated
    if (!token) {
      return { authenticated: false, error: 'No authentication token found' };
    }

    // Verify the token
    const payload = verifyToken(token);
    if (!payload) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    // Authentication successful
    return {
      authenticated: true,
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      },
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    };
  }
}

// Middleware to protect admin routes
export async function isAdmin(req: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateUser(req);
  
  if (!authResult.authenticated) {
    return authResult;
  }
  
  // Check if user has admin role
  if (authResult.user?.role !== 'admin') {
    return {
      authenticated: false,
      error: 'Access denied: Admin privileges required',
    };
  }
  
  return authResult;
}
