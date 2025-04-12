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
    
    // Log the cart update operation with more details
    console.log(`Updating cart for user ${authResult.user?.id}`);
    console.log(`Cart items: ${cart?.length || 0}`);
    
    // Special handling for clearing the cart
    const isClearing = Array.isArray(cart) && cart.length === 0;
    if (isClearing) {
      console.log(`CLEARING CART for user ${authResult.user?.id}`);
    }
    
    await connectDB();
    const user = await User.findByIdAndUpdate(
      authResult.user?.id,
      { $set: { cart: cart || [] } }, // Ensure we handle null/undefined cart
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Special response for clearing cart
    if (isClearing) {
      console.log(`Cart cleared successfully for user ${authResult.user?.id}`);
      return NextResponse.json({
        success: true,
        cleared: true,
        cart: []
      });
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

// New: Add a special DELETE method just for clearing the cart
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    console.log(`DELETE request to clear cart for user ${authResult.user?.id}`);
    
    await connectDB();
    const user = await User.findByIdAndUpdate(
      authResult.user?.id,
      { $set: { cart: [] } },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    console.log(`Cart successfully cleared via DELETE for user ${authResult.user?.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear cart' 
    }, { status: 500 });
  }
}
