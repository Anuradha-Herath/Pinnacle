import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add cache headers for API routes that should be cached
  if (request.nextUrl.pathname.startsWith('/api/customer/products') || 
      request.nextUrl.pathname.startsWith('/api/customer/trending') ||
      request.nextUrl.pathname.startsWith('/api/discounts/product/')) {
    
    const response = NextResponse.next();
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=60');
    response.headers.set('CDN-Cache-Control', 'max-age=180');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/customer/:path*',
    '/api/discounts/product/:path*'
  ]
};
