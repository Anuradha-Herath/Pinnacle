import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// GET inventory items
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build filter based on query params
    const filter: Record<string, any> = {};
    if (tag) filter.tags = tag;
    
    // Count total inventory items matching the filter
    const total = await Inventory.countDocuments(filter);
    
    // Get inventory with populated product data
    const inventoryItems = await Inventory.find(filter)
      .populate('productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({ 
      inventoryItems,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory" 
    }, { status: 500 });
  }
}

// Update inventory item
export async function PUT(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, quantity, tags } = body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id, 
      {
        quantity,
        tags,
        updatedAt: new Date()
      }, 
      { new: true }
    ).populate('productId');
    
    if (!updatedInventory) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Inventory updated successfully",
      inventory: updatedInventory
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update inventory" 
    }, { status: 500 });
  }
}
