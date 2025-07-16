import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { authenticateUser } from '@/middleware/auth';

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await authenticateUser(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: authResult.error || 'Authentication required' 
      }, { 
        status: 401,
        headers: corsHeaders,
      });
    }
    
    // Connect to database
    await connectDB();
    
    // Get user details
    const user = await User.findById(authResult.user?.id).select('-password');
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { 
        status: 404,
        headers: corsHeaders,
      });
    }
    
    // Return user data
    return NextResponse.json({ 
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }, {
      headers: corsHeaders,
    });
    
  } catch (error) {
    console.log('Error fetching user profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user profile' 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
