import { NextResponse } from 'next/server';

export function POST() {
  // Create response
  const response = NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
  
  // Clear the token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge: 0 // Expire immediately
  });
  
  return response;
}
