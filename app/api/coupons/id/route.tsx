import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Coupon from '@/models/coupons';

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB via Mongoose');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// GET a coupon by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const coupon = await Coupon.findById(params.id);
    
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch coupon" 
    }, { status: 500 });
  }
}

// PUT (update) a coupon by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      params.id,
      {
        product: body.product,
        price: body.price,
        discount: body.discount,
        code: body.code,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.status,
        description: body.description || ''
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Coupon updated successfully", 
      coupon: updatedCoupon 
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update coupon" 
    }, { status: 500 });
  }
}

// DELETE a coupon by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deletedCoupon = await Coupon.findByIdAndDelete(params.id);
    
    if (!deletedCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Coupon deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete coupon" 
    }, { status: 500 });
  }
}