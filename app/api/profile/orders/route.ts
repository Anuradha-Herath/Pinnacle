import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';
import User from '@/models/User'; // Import User model

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

// Add a helper function to check and fix user profile pictures for any query that returns user data
async function ensureValidProfilePicture(userId: string) {
  try {
    const user = await User.findById(userId);
    if (user && (!user.profilePicture || user.profilePicture === '/default-profile.png')) {
      user.profilePicture = '/p9.webp';
      await user.save();
    }
  } catch (error) {
    console.error("Error updating profile picture:", error);
  }
}

// GET - Get authenticated user's orders
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
      }, { status: 401 });
    }

    console.log("Fetching orders for user:", authResult.user?.id);
    
    // Check and update user profile picture if needed - with null check
    if (authResult.user?.id) {
      await ensureValidProfilePicture(authResult.user.id);
    }
    
    // Get orders for the authenticated user
    const orders = await Order.find({ user: authResult.user?.id })
      .sort({ createdAt: -1 }); // Most recent orders first
    
    console.log(`Found ${orders.length} orders for user`);
    
    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    }, { status: 500 });
  }
}
