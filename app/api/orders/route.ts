import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import Order from '@/models/Order';

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('MongoDB connected in orders API');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// GET - Fetch all orders (for admin)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Check if user is authenticated and is an admin
    const authResult = await authenticateUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // For non-admin users, return forbidden
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }

    // Fetch all orders
    const orders = await Order.find().sort({ createdAt: -1 });
    
    // Transform orders to match the expected format in the admin page
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || `ORD-${order._id.toString().substr(-8)}`,
      createdAt: order.createdAt,
      customer: {
        firstName: order.user ? 'Registered User' : (order.customer?.firstName || 'Guest'),
        lastName: order.customer?.lastName || '',
        email: order.customer?.email || '',
      },
      totalPrice: order.totalPrice,
      status: order.status
    }));

    console.log(`Found ${orders.length} orders in the database`);
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    }, { status: 500 });
  }
}
