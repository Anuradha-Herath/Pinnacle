import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getToken } from 'next-auth/jwt';

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
    // First try the traditional JWT token
    let token = req.cookies.get('token')?.value;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        return {
          authenticated: true,
          user: decoded,
        };
      }
    }

    // If no token or invalid token, try NextAuth session
    try {
      const nextAuthToken = await getToken({
        req: req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (nextAuthToken?.id) {
        return {
          authenticated: true,
          user: {
            id: nextAuthToken.id,
            email: nextAuthToken.email as string,
            role: nextAuthToken.role as string,
          },
        };
      }
    } catch (error) {
      console.error('NextAuth session check error:', error);
    }

    // No valid authentication found
    return {
      authenticated: false,
      error: 'Authentication required',
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
