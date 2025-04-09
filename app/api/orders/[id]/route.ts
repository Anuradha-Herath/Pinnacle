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

    // For admin panel, we'll temporarily skip authentication
    // In a production environment, ensure proper authentication is in place
    // const authResult = await authenticateUser(req);
    // if (!authResult.authenticated) {
    //   return NextResponse.json({
    //     success: false,
    //     error: authResult.error || 'Authentication required',
    //   }, { status: 401 });
    // }

    // Find order by ID or orderNumber
    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('line_items.productId');
    } else {
      order = await Order.findOne({ orderNumber: orderId }).populate('line_items.productId');
    }
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    // In a production environment, check if user has permission to view this order
    // if (order.user.toString() !== authResult.user?.id && authResult.user?.role !== 'admin') {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Not authorized to access this order',
    //   }, { status: 403 });
    // }

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

// PATCH - Update order status
export async function PATCH(
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

    // For admin panel, we'll temporarily skip authentication
    // In a production environment, ensure proper authentication is in place
    // const authResult = await authenticateUser(req);
    // if (!authResult.authenticated || authResult.user?.role !== 'admin') {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'Admin authentication required',
    //   }, { status: 401 });
    // }

    const { status, timelineEvent } = await req.json();

    // Find order by ID
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    // Update order status if provided
    if (status) {
      order.status = status;
    }

    // Add timeline event if provided
    if (timelineEvent) {
      if (!order.timeline) {
        order.timeline = [];
      }
      order.timeline.push(timelineEvent);
    }

    // Update the updatedAt timestamp
    order.updatedAt = new Date();

    // Save the updated order
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order',
    }, { status: 500 });
  }
}
