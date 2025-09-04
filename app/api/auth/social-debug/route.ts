import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';

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

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
  }
  
  try {
    await connectDB();
    
    // Get email from query params
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }
    
    // Find user and use proper type assertion
    const user = await User.findOne({ email }).lean() as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return user details without sensitive info
    return NextResponse.json({
      user: {
        ...user,
        _id: user._id ? user._id.toString() : 'unknown',
        password: user.password ? '**exists**' : '**undefined**',
        hasPassword: !!user.password,
        provider: user.provider || 'none',
        schema: {
          passwordRequired: !!user.password
        }
      }
    });
  } catch (error) {
    console.error('Social debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Debug failed' 
    }, { status: 500 });
  }
}
