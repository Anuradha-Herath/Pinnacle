import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Coupon from '@/models/coupons';

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

// GET a specific coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const id = params.id;
    console.log(`Fetching coupon with ID: ${id}`);
    
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch coupon",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT to update a specific coupon by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
      const id = params.id;
    const body = await request.json();
    console.log(`Updating coupon with ID: ${id}`);
    
    // Calculate the status based on dates - similar to discounts
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    let couponStatus;
    
    if (new Date(body.startDate) > new Date(currentDate)) {
      couponStatus = 'Future Plan';
    } else if (new Date(body.endDate) < new Date(currentDate)) {
      couponStatus = 'Inactive';
    } else {
      couponStatus = 'Active';
    }
    
    // Extract specific fields with validation
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id, 
      {
        product: body.product,
        price: body.price,
        discount: body.discount,
        code: body.code,
        startDate: body.startDate,
        endDate: body.endDate,
        status: couponStatus, // Use calculated status instead of body.status
        description: body.description || '',
        customerEligibility: body.customerEligibility,
        limit: body.limit,
        oneTimeUse: body.oneTimeUse,
        couponType: body.couponType,
        discountType: body.discountType,
        minOrderValue: body.minOrderValue
      }, 
      { new: true, runValidators: true });
    if (!updatedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    console.log('Coupon updated successfully with status:', couponStatus);
    return NextResponse.json({ 
      message: "Coupon updated successfully", 
      coupon: updatedCoupon 
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update coupon",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE a specific coupon by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const id = params.id;
    console.log(`Deleting coupon with ID: ${id}`);
    
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    console.log('Coupon deleted successfully');
    return NextResponse.json({ 
      message: "Coupon deleted successfully", 
      coupon: deletedCoupon 
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete coupon",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
