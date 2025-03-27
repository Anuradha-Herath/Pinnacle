import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Discount from '@/models/Discount';

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

// GET all discounts
export async function GET() {
  try {
    console.log('GET /api/discounts: Starting request');
    await connectDB();
    console.log('Database connected, fetching discounts...');
    
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    console.log(`Found ${discounts.length} discounts`);
    
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    // Return a more informative error
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discounts",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST a new discount
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Creating new discount with data:', body);
    
    // Create new discount with status as-is (already correctly capitalized from client)
    const newDiscount = new Discount({
      product: body.productId,
      type: body.discountType,  // Remove the capitalization logic as it might cause issues
      percentage: body.discountPercentage,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.discountStatus,
      description: body.description || '',
      applyToAllProducts: body.discountType === 'Category'
    });
    
    console.log('Saving discount to database...');
    await newDiscount.save();
    console.log('Discount saved successfully');
    
    return NextResponse.json({ 
      message: "Discount created successfully", 
      discount: newDiscount 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create discount",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
