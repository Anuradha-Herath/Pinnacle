import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Remove Node.js JWT library that doesn't work in Edge Runtime
// import jwt from 'jsonwebtoken';

// Simple JWT decoder for Edge runtime (without signature verification)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
    
    const decoded = JSON.parse(atob(padded));
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.log('JWT decode error:', error);
    return null;
  }
}

// Define user protected routes - all routes in (user) folder that require auth
const userProtectedRoutes = [
  '/profilepage',
  '/cart',
  '/checkout',
  '/orders',
  '/orderdetails',
  '/account',
  '/wishlist',
  '/toreviewpage',
  '/toreceivepage',
  '/topaypage',
  '/productReview',
  '/ordertracking',
  '/profile'
];

// Define admin protected routes - all routes in admin folder EXCEPT login
const adminProtectedRoutes = [
  '/admin/dashboard',
  '/admin/adminprofile',
  '/admin/productlist',
  '/admin/productcreate',
  '/admin/discountlist',
  '/admin/inventorylist',
  '/admin/salesreport'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/password-reset',
  '/request-reset',
  '/about',
  '/faq',
  '/category',
  '/gemini-test',
  '/admin/adminlogin'  // Admin login page should be public
];

export function routeProtectionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle CORS for all API routes to fix Edge browser issues
  if (pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Special handling for webhook routes
    if (pathname === '/api/webhook') {
      return NextResponse.next();
    }

    // Add performance headers for API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the current path is a user protected route
  const isUserProtectedRoute = userProtectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an admin protected route
  const isAdminProtectedRoute = (pathname.startsWith('/admin') && pathname !== '/admin/adminlogin') ||
    adminProtectedRoutes.some(route => pathname.startsWith(route));

  console.log('Middleware - Route check:', { 
    pathname, 
    isUserProtectedRoute, 
    isAdminProtectedRoute,
    isPublicRoute 
  });

  if (isUserProtectedRoute || isAdminProtectedRoute) {
    // Get the token from cookies - check both custom token and NextAuth token
    const customToken = request.cookies.get('token')?.value;
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    console.log('Middleware - Tokens found:', { 
      customToken: customToken ? 'Yes' : 'No',
      nextAuthToken: nextAuthToken ? 'Yes' : 'No',
      path: pathname
    });
    console.log('Middleware - Route type:', isAdminProtectedRoute ? 'ADMIN' : 'USER');

    // If we have a NextAuth token but no custom token, allow access for user routes
    if (!customToken && nextAuthToken && isUserProtectedRoute) {
      console.log('Middleware - NextAuth session found, allowing user access for path:', pathname);
      return NextResponse.next();
    }

    if (!customToken && !nextAuthToken) {
      // No token, redirect to appropriate login page
      const url = request.nextUrl.clone();
      if (isAdminProtectedRoute) {
        url.pathname = '/admin/adminlogin';
        url.searchParams.set('error', 'Authentication required to access admin area');
      } else {
        url.pathname = '/login';
        url.searchParams.set('error', 'Please log in to access this page');
      }
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // If we have a custom token, verify it
    if (customToken) {
      try {
        // Verify the token using Edge-compatible decoder
        const decoded = decodeJWT(customToken);
        
        if (!decoded) {
          throw new Error('Invalid or expired token');
        }
        
        console.log('Middleware - Custom token decoded successfully:', { id: decoded.id, role: decoded.role, email: decoded.email });
        
        // Check admin routes - must have admin role
        if (isAdminProtectedRoute && decoded.role !== 'admin') {
          console.log('Middleware - Admin access denied, user role:', decoded.role);
          const url = request.nextUrl.clone();
          url.pathname = '/admin/adminlogin';
          url.searchParams.set('error', 'Admin privileges required');
          return NextResponse.redirect(url);
        }
        
        // Check user routes - must be regular user or admin (only check for id, not userId)
        if (isUserProtectedRoute && !decoded.id) {
          console.log('Middleware - User access denied, no valid user ID:', decoded);
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('error', 'Valid user authentication required');
          return NextResponse.redirect(url);
        }
        
        console.log('Middleware - Custom token access granted for path:', pathname);
        // Token is valid, continue
        return NextResponse.next();
      } catch (error) {
        console.log('Middleware - Custom token verification failed:', error instanceof Error ? error.message : error);
        // Invalid token, redirect to appropriate login page
        const url = request.nextUrl.clone();
        if (isAdminProtectedRoute) {
          url.pathname = '/admin/adminlogin';
          url.searchParams.set('error', 'Session expired. Please log in again');
        } else {
          url.pathname = '/login';
          url.searchParams.set('error', 'Session expired. Please log in again');
        }
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
