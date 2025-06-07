import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';

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

    console.log("Looking for orders for user ID:", authResult.user?.id);
    
    // Check for orders with both potential field names (userId and user)
    const orders = await Order.find({
      $or: [
        { user: authResult.user?.id },
        { userId: authResult.user?.id }
      ]
    }).sort({ createdAt: -1 }); // Most recent orders first
    
    console.log(`Found ${orders.length} orders for this user`);
    
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
