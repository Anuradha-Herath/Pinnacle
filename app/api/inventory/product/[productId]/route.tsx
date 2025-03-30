import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Inventory from '@/models/Inventory';

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

// GET inventory by product ID
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();
    
    const { productId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    // Find inventory by productId
    const inventory = await Inventory.findOne({ productId });
    
    if (!inventory) {
      return NextResponse.json({ 
        message: "No inventory found for this product",
        inventory: null 
      }, { status: 200 }); // Return 200 with null inventory rather than 404
    }
    
    return NextResponse.json({ 
      inventory,
      message: "Inventory found" 
    });
  } catch (error) {
    console.error("Error fetching inventory by product ID:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory" 
    }, { status: 500 });
  }
}
