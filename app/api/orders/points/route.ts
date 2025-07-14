import { NextRequest, NextResponse } from 'next/server';
import connectDB from "@/lib/db";
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { orderNumber } = await req.json();
    
    if (!orderNumber) {
      return NextResponse.json({
        success: false,
        error: 'OrderNumber is required',
      }, { status: 400 });
    }

    // Find order by OrderNumber and check if payment is completed
    const order = await Order.findOne({ 
      orderNumber: orderNumber,
      paymentStatus: "paid"
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found or payment not completed',
      }, { status: 404 });
    }

    const userId = order.userId;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID not found in order',
      }, { status: 404 });
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID format',
      }, { status: 400 });
    }
    
    // Calculate loyalty points - 10% of total price rounded to nearest integer
    const pointsEarned = Math.round(order.amount.total * 0.1);
    console.log('amount in order: ', order.amount.total);
    console.log('points earned in order: ', pointsEarned);

    // Update order with points earned (also verify payment status again)
    const updatedOrder = await Order.findOneAndUpdate(
      { 
        orderNumber: orderNumber,
        paymentStatus: "paid"
      },
      { 
        pointsEarned: pointsEarned,
        updatedAt: new Date()
      },
      { new: true }
    );
    console.log('points earned in order: ', pointsEarned);

    if (!updatedOrder) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update order with points or payment not completed',
      }, { status: 500 });
    }

    // Update user points
    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { 
          $inc: { points: pointsEarned },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
      console.log('updated user points: ', updatedUser.points);

      if (!updatedUser) {
        // If user update fails, revert the order update
        await Order.findOneAndUpdate(
          { orderNumber: orderNumber },
          { $unset: { pointsEarned: "" } }
        );
        
        return NextResponse.json({
          success: false,
          error: 'User not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Points added successfully',
        pointsEarned,
        userTotalPoints: updatedUser.points,
      });

    } catch (pointsError) {
      console.error('Failed to update user points:', pointsError);
      
      // Revert the order update if user update fails
      await Order.findOneAndUpdate(
        { orderNumber: orderNumber },
        { $unset: { pointsEarned: "" } }
      );
      
      return NextResponse.json({
        success: false,
        error: 'Failed to update user points',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Points processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process points',
    }, { status: 500 });
  }
}