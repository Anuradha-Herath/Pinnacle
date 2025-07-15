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

// GET all coupons
export async function GET() {
  try {
    console.log('GET /api/coupons: Starting request');
    await connectDB();
    console.log('Database connected, fetching coupons...');
    
    // First, update coupon statuses based on current date - similar to discounts
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    // Update expired active coupons to Inactive
    const expiredResult = await Coupon.updateMany(
      { 
        status: 'Active', 
        endDate: { $lt: today } 
      },
      { 
        $set: { status: 'Inactive' } 
      }
    );
    
    console.log(`Updated ${expiredResult.modifiedCount} expired coupons to Inactive status`);
    
    // Update future coupons to Active when their start date has arrived
    const futureResult = await Coupon.updateMany(
      { 
        status: 'Future Plan', 
        startDate: { $lte: today },
        endDate: { $gte: today }
      },
      { 
        $set: { status: 'Active' } 
      }
    );
    
    console.log(`Updated ${futureResult.modifiedCount} future coupons to Active status`);
    
    // Then fetch all coupons (now with correct statuses)
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    console.log(`Found ${coupons.length} coupons`);
    
    return NextResponse.json({ 
      coupons,
      updated: expiredResult.modifiedCount > 0 || futureResult.modifiedCount > 0
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch coupons",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST a new coupon
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Creating new coupon with data:', body);
    
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
    
    const newCoupon = new Coupon({
      product: body.product,
      price: body.price,
      discount: body.discount,
      code: body.code,
      startDate: body.startDate,
      endDate: body.endDate,
      status: couponStatus, // Use calculated status instead of body.status
      description: body.description || '',
      customerEligibility: body.customerEligibility || 'all',
      limit: body.limit || '0',
      oneTimeUse: body.oneTimeUse || false,
      // Include other fields from the coupon model
      couponType: body.couponType,
      discountType: body.discountType,
      minOrderValue: body.minOrderValue
    });
    
    console.log('Saving coupon to database...');
    await newCoupon.save();
    console.log('Coupon saved successfully');
    
    return NextResponse.json({ 
      message: "Coupon created successfully", 
      coupon: newCoupon 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create coupon",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT to update a coupon
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Updating coupon with data:', body);
    
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
    
    // Update the coupon with calculated status
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      body.id, 
      { 
        ...body, 
        status: couponStatus // Override with calculated status
      }, 
      { new: true }
    );
    
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

// DELETE a coupon
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Deleting coupon with ID:', body.id);
    
    const deletedCoupon = await Coupon.findByIdAndDelete(body.id);
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