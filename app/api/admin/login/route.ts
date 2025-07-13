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
    console.error('MongoDB connection error:', error);
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
    
    // Return same error message even if user doesn't exist (security)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials',
        remainingAttempts: 5 // Default max attempts
      }, { status: 401 });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Account is temporarily locked due to too many failed attempts',
        accountLocked: true,
        lockUntil: user.lockUntil
      }, { status: 423 }); // 423 Locked
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    // Check if this is an admin account
    const isAdmin = user.role === 'admin';
    
    if (!isPasswordValid || !isAdmin) {
      // Increment login attempts and potentially lock account
      await user.incrementLoginAttempts();
      
      // Calculate remaining attempts
      const remainingAttempts = Math.max(0, 5 - user.loginAttempts);
      
      return NextResponse.json({ 
        success: false, 
        error: !isAdmin ? 'Admin access required' : 'Invalid credentials',
        remainingAttempts,
        accountLocked: remainingAttempts === 0,
        lockUntil: user.lockUntil
      }, { status: 401 });
    }
    
    // Login successful - reset login attempts
    await user.resetLoginAttempts();
    
    // Generate JWT token
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
      // 7 days in seconds
      maxAge: 7 * 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    }, { status: 500 });
  }
}
