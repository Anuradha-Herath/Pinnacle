import { NextRequest, NextResponse } from 'next/server';import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';
import connectDB from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    await connectDB();
    
    // Find the most recent order for this user
    const recentOrder = await Order.findOne({ 
      userId: authResult.user?.id 
    }).sort({ 
      createdAt: -1 
    }).limit(1);
    
    if (!recentOrder) {
      return NextResponse.json({
        success: true,
        order: null,
        message: 'No orders found'
      });
    }
    
    return NextResponse.json({
      success: true,
      order: recentOrder
    });
    
  } catch (error) {
    console.error('Error fetching recent order:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch recent order' 
    }, { status: 500 });
  }
}
