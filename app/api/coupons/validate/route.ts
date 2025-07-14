import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Coupon from '../../../../models/coupons';

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB via Mongoose');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// POST - Validate coupon code
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { code, subtotal } = await request.json();
    
    if (!code) {
      return NextResponse.json({ 
        error: "Coupon code is required" 
      }, { status: 400 });
    }

    // Find the coupon by code (case insensitive)
    const coupon = await Coupon.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      status: 'Active'
    });

    if (!coupon) {
      return NextResponse.json({ 
        error: "Invalid or expired coupon code" 
      }, { status: 404 });
    }

    // Check if coupon is within valid date range
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    
    // Set time to start of day for proper comparison
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (now < startDate) {
      return NextResponse.json({ 
        error: "This coupon is not yet active" 
      }, { status: 400 });
    }

    if (now > endDate) {
      return NextResponse.json({ 
        error: "This coupon has expired" 
      }, { status: 400 });
    }

    // Calculate discount amount
    const discountPercentage = parseFloat(coupon.discount);
    
    // Validate discount percentage
    if (discountPercentage <= 0 || discountPercentage > 100) {
      return NextResponse.json({ 
        error: "Invalid discount percentage" 
      }, { status: 400 });
    }
    
    const discountAmount = (subtotal * discountPercentage) / 100;

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        discountAmount: discountAmount,
        description: coupon.description || `${coupon.discount}% off your order`
      }
    });

  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ 
      error: "Failed to validate coupon" 
    }, { status: 500 });
  }
}
