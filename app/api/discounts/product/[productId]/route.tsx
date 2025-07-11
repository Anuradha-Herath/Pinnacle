import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Discount from '@/models/Discount';

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

// GET discounts applicable to a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Get productId parameter asynchronously
    const { productId } = await params;
    
    if (!productId || productId === 'undefined' || productId === 'null') {
      return NextResponse.json({ 
        message: "Invalid product ID", 
        error: "ProductId is missing or invalid" 
      }, { status: 400 });
    }

    await connectDB();
    
    // Find any active discounts for this specific product
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const discount = await Discount.findOne({
      product: productId,
      type: 'Product',
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).sort({ percentage: -1 }); // Get the highest discount if multiple exist
    
    if (!discount) {
      // Return a success response with no discount, rather than an error
      return NextResponse.json({ 
        message: "No active discount found for this product",
        discount: null
      });
    }
    
    return NextResponse.json({ 
      discount: {
        id: discount._id,
        percentage: discount.percentage,
        active: true,
        // Include additional information for debugging
        productId: discount.product,
        type: discount.type,
        startDate: discount.startDate,
        endDate: discount.endDate
      } 
    });
  } catch (error) {
    console.error("Error fetching product discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discount information",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
}
