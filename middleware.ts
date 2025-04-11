import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Special handling for webhook routes
  if (request.nextUrl.pathname === '/api/webhook') {
    // Pass through the request without any modifications
    // This ensures the raw body is preserved for Stripe signature verification
    return NextResponse.next();
  }
  
  // Continue normal processing for other routes
  return NextResponse.next();
}
