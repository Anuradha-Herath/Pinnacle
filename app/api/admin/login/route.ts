import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.log('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Parse request body
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide email and password' 
      }, { status: 400 });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // If user doesn't exist, return error
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // If user exists but is not admin, return error
    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin privileges only.'
      }, { status: 403 });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Login successful - generate JWT token
    const token = generateToken(user);
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
    
    // Set token as HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      // 1 day in seconds
      maxAge: 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.log('Admin login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    }, { status: 500 });
  }
}
