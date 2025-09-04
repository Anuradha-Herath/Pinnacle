import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { adaptUsers } from '@/utils/modelAdapters';

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
  try {
    await connectDB();
    
    // Get all users (in a real app, you might want to implement pagination)
    const users = await User.find({}, {
      password: 0, // Exclude password from the results
      resetPasswordToken: 0,
      resetPasswordExpires: 0,
      passwordResetToken: 0,
      passwordResetExpires: 0
    }).sort({ createdAt: -1 }).exec(); // Sort by newest first
    
    // Convert users to plain objects and use adapter to handle points
    const userObjects = users.map(user => user.toObject());
    const processedUsers = adaptUsers(userObjects);
    
    return NextResponse.json({ 
      success: true, 
      users: processedUsers
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch users' 
    }, { status: 500 });
  }
}
