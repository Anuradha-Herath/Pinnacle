import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    
    if (!orderNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order number is required' 
      }, { status: 400 });
    }

    const authResult = await authenticateUser(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    await connectDB();
    
    // Find the order by order number
    const order = await Order.findOne({ orderNumber: orderNumber });
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }

    // Verify the order belongs to the authenticated user
    if (order.userId !== authResult.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access to order' 
      }, { status: 403 });
    }

    // Get user's total points
    const user = await User.findById(authResult.user?.id);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pointsEarned: order.pointsEarned || 0,
      totalPoints: user.points || 0,
      orderTotal: order.amount?.total || 0
    });
    
  } catch (error) {
    console.error('Error fetching order points:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch order points' 
    }, { status: 500 });
  }
}
