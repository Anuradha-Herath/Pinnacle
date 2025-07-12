import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectDB();
    
    const userId = params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID format' 
      }, { status: 400 });
    }
    
    // Get orders by user ID, sorted by newest first
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent orders
    
    // Get total number of orders for this user
    const totalOrders = await Order.countDocuments({ userId });
    
    // Calculate total amount spent by this user
    const totalAmountPipeline = await Order.aggregate([
      { $match: { userId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount.total' } } }
    ]);
    
    const totalAmount = totalAmountPipeline.length > 0 ? totalAmountPipeline[0].total : 0;
    
    return NextResponse.json({ 
      success: true, 
      orders,
      totalOrders,
      totalAmount
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user orders' 
    }, { status: 500 });
  }
}
