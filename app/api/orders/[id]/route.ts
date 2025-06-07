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

// GET - Get order details - completely reworked
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    await connectDB();

    // Extract the ID through a more careful approach
    let orderId;
    try {
      // Use optional chaining and type assertion to safely access ID
      orderId = context?.params?.id;
    } catch (e) {
      console.error("Error accessing params:", e);
    }

    // Validate order ID
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Valid order ID is required',
      }, { status: 400 });
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.authenticated) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
      }, { status: 401 });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    // Check if the order belongs to the authenticated user or if user is admin
    // Handle both user and userId fields for compatibility
    const orderUserId = order.user?.toString() || order.userId?.toString();

    // If no user ID is associated with the order, only admins can access it
    if (!orderUserId) {
      if (authResult.user?.role !== 'admin') {
        return NextResponse.json({
          success: false,
          error: 'Not authorized to access this order',
        }, { status: 403 });
      }
    } 
    // Otherwise check if the current user owns this order or is an admin
    else if (orderUserId !== authResult.user?.id && authResult.user?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to access this order',
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order',
    }, { status: 500 });
  }
}
