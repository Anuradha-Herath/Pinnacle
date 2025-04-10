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

// PUT - Update order status
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get the orderId from params
    const { id: orderId } = context.params;
    
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID',
      }, { status: 400 });
    }

    // Authenticate user - only admins can update order status
    const authResult = await authenticateUser(req);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { status } = body;
    
    // Validate status
    const validStatuses = ['Processing', 'Shipping', 'Out For Delivery', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status value',
      }, { status: 400 });
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    
    if (!updatedOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    }, { status: 500 });
  }
}
