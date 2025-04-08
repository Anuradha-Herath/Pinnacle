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
    
    // Calculate the status based on dates
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    let discountStatus;
    
    if (new Date(body.startDate) > new Date(currentDate)) {
      discountStatus = 'Future Plan';
    } else if (new Date(body.endDate) < new Date(currentDate)) {
      discountStatus = 'Inactive';
    } else {
      discountStatus = 'Active';
    }
    
    // Check if we're dealing with multiple products
    if (Array.isArray(body.productId) && body.productId.length > 0) {
      console.log(`Creating ${body.productId.length} individual product discounts`);
      
      // Create an array of discount documents to insert
      const discountDocuments = body.productId.map((productId: string) => ({
        product: productId,
        type: 'Product', // Always set type to Product when handling multiple products
        percentage: Number(body.discountPercentage),
        startDate: body.startDate,
        endDate: body.endDate,
        status: discountStatus || body.discountStatus,
        description: body.description || '',
        applyToAllProducts: false
      }));
      
      // Insert all discounts at once
      const result = await Discount.insertMany(discountDocuments);
      console.log(`Successfully created ${result.length} discounts`);
      
      return NextResponse.json({ 
        message: `Successfully created ${result.length} product discounts`, 
        discountCount: result.length 
      }, { status: 201 });
    } else {
      // Handle single product
      const newDiscount = new Discount({
        product: body.productId, // This should be a string
        type: body.discountType,
        percentage: Number(body.discountPercentage),
        startDate: body.startDate,
        endDate: body.endDate,
        status: discountStatus || body.discountStatus, // Use calculated status or provided status
        description: body.description || '',
        applyToAllProducts: false
      });
      
      console.log('Saving discount to database...');
      await newDiscount.save();
      console.log('Discount saved successfully');
      
      return NextResponse.json({ 
        message: "Discount created successfully", 
        discount: newDiscount 
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create discount",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
