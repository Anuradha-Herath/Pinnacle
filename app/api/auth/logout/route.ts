import { NextResponse } from 'next/server';

export function POST() {
  // Create response
  const response = NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
  
  // Clear the token cookie with multiple approaches for better compatibility
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge: 0 // Expire immediately
  });
  
  // Also set with expires in the past for additional clearing
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0) // Set to Unix epoch
  });
  
  return response;
}
