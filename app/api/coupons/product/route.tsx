import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Coupon from '@/models/coupons';

// Connect to MongoDB
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

// GET coupons applicable to a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();
    
    const { productId } = params;
    
    // Find active coupons for the specific product
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const coupon = await Coupon.findOne({
      product: productId,
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).sort({ discount: -1 }); // Get the highest discount if multiple exist
    
    if (!coupon) {
      return NextResponse.json({ message: "No active coupon found for this product" });
    }
    
    return NextResponse.json({ 
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discount: coupon.discount,
        active: true
      } 
    });
  } catch (error) {
    console.error("Error fetching product coupon:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch coupon information" 
    }, { status: 500 });
  }
}