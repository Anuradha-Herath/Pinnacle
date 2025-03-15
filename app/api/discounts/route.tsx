import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Discount from '@/models/Discount';

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

// GET all discounts
export async function GET() {
  try {
    await connectDB();
    
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discounts" 
    }, { status: 500 });
  }
}

// POST a new discount
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Create new discount with proper capitalized status
    const newDiscount = new Discount({
      product: body.productId,
      type: body.discountType.charAt(0).toUpperCase() + body.discountType.slice(1),
      percentage: body.discountPercentage,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.discountStatus.charAt(0).toUpperCase() + body.discountStatus.slice(1),
      description: body.description || '',
      applyToAllProducts: body.discountType === 'Category' // Set true if category type
    });
    
    await newDiscount.save();
    
    return NextResponse.json({ 
      message: "Discount created successfully", 
      discount: newDiscount 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create discount" 
    }, { status: 500 });
  }
}
