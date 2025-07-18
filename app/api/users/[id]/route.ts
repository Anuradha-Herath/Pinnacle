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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID format' 
      }, { status: 400 });
    }
    
    // Get user by ID (excluding password)
    const user = await User.findById(userId, {
      password: 0, // Exclude password from the results
      resetPasswordToken: 0,
      resetPasswordExpires: 0,
      passwordResetToken: 0,
      passwordResetExpires: 0
    }).exec(); // Use exec() instead of lean()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Convert to plain object for manipulation
    const userObj = user.toObject();
    
    // Ensure points is a number
    if (userObj.points === undefined || userObj.points === null) {
      userObj.points = 0;
    }
    
    return NextResponse.json({ 
      success: true, 
      user: userObj
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user' 
    }, { status: 500 });
  }
}
