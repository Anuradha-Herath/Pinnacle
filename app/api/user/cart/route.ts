import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authenticateUser } from '@/middleware/auth';
import User from '@/models/User';

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

// Get user's cart
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
    const user = await User.findById(authResult.user?.id);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      cart: user.cart || []
    });
    
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch cart' 
    }, { status: 500 });
  }
}

// Update cart (replace entire cart)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const { cart } = await request.json();
    
    await connectDB();
    const user = await User.findByIdAndUpdate(
      authResult.user?.id,
      { $set: { cart } },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      cart: user.cart
    });
    
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update cart' 
    }, { status: 500 });
  }
}
