import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import the coupon status updater
let updateCouponStatuses: (() => Promise<any>) | null = null;

// Lazy load the coupon status updater to avoid import issues in middleware
const getCouponStatusUpdater = async () => {
  if (!updateCouponStatuses) {
    try {
      const module = await import('./lib/couponStatusUpdater');
      updateCouponStatuses = module.updateCouponStatuses;
    } catch (error) {
      console.error('Error loading coupon status updater:', error);
    }
  }
  return updateCouponStatuses;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Auto-update coupon statuses when accessing coupon-related routes
  if (pathname.startsWith('/api/coupons') || pathname.startsWith('/admin/coupon')) {
    try {
      const updater = await getCouponStatusUpdater();
      if (updater) {
        // Run coupon status update in background (don't await to avoid blocking)
        updater().catch(error => {
          console.error('Background coupon status update failed:', error);
        });
      }
    } catch (error) {
      console.error('Error running coupon status update:', error);
    }
  }
  
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
      // Pass through the request without any modifications
      // This ensures the raw body is preserved for Stripe signature verification
      return NextResponse.next();
    }

    // Add performance headers for API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return response;
  }
  
  // Continue normal processing for other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/coupon:path*',
  ],
};
