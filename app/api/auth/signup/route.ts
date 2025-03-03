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
    const { firstName, lastName, email, password } = await request.json();
    
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide all required fields' 
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email already in use' 
      }, { status: 409 });
    }
    
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      // role is set to 'user' by default in the schema
    });
    
    // Save user to database
    await newUser.save();
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      }
    }, { status: 201 });
    
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
    console.error('Signup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register user' 
    }, { status: 500 });
  }
}
