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

// GET - Get order details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required',
      }, { status: 400 });
    }

    // Authenticate user
    const authResult = await authenticateUser(req);
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
    if (order.user.toString() !== authResult.user?.id && authResult.user?.role !== 'admin') {
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
