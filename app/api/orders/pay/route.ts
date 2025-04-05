import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';
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

// POST - Process payment for an order
export async function POST(req: NextRequest) {
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

    // Parse request body
    const { orderId, paymentDetails } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required',
      }, { status: 400 });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
      }, { status: 404 });
    }

    // Verify that the order belongs to the authenticated user
    if (order.user.toString() !== authResult.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Not authorized to process this order',
      }, { status: 403 });
    }

    // Process payment (this would interface with a payment processor)
    // For this example, we're assuming payment is successful
    
    // Update order with payment result
    order.paymentResult = {
      id: paymentDetails.id || `PAY-${Date.now()}`,
      status: 'completed',
      update_time: new Date().toISOString(),
      email_address: paymentDetails.email_address,
    };

    // Calculate loyalty points - 10% of total price rounded to nearest integer
    const pointsEarned = Math.round(order.totalPrice * 0.1);
    order.pointsEarned = pointsEarned;

    // Save updated order
    await order.save();

    // Update user's total points - with proper error handling
    try {
      // Using findOneAndUpdate to safely update the points in one atomic operation
      const updatedUser = await User.findOneAndUpdate(
        { _id: order.user },
        { $inc: { points: pointsEarned } }, // Use $inc to safely increment regardless of current value
        { new: true } // Return the updated document
      );

      if (!updatedUser) {
        console.error('User not found when updating points');
      }

    } catch (pointsError) {
      console.error('Failed to update user points:', pointsError);
      // Continue with success response as payment is still processed
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      pointsEarned,
      order: {
        id: order._id,
        status: order.status,
        totalPrice: order.totalPrice,
        pointsEarned: order.pointsEarned
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment',
    }, { status: 500 });
  }
}
