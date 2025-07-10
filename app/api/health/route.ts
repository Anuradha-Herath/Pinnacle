import { NextResponse } from 'next/server';

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Simple health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'API is working',
      timestamp: new Date().toISOString(),
      userAgent: 'Not available in API route',
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'API health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
