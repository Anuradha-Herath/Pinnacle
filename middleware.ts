import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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

export function middleware(request: NextRequest) {
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

  if (isUserProtectedRoute || isAdminProtectedRoute) {
    // Get the token from cookies
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
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

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check admin routes - must have admin role
      if (isAdminProtectedRoute && decoded.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/adminlogin';
        url.searchParams.set('error', 'Admin privileges required');
        return NextResponse.redirect(url);
      }
      
      // Check user routes - must be regular user or admin
      if (isUserProtectedRoute && !decoded.userId && !decoded.id) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'Valid user authentication required');
        return NextResponse.redirect(url);
      }
      
      // Token is valid, continue
      return NextResponse.next();
    } catch (error) {
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

  return NextResponse.next();
}

export const config = {
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
