import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Inventory from '@/models/Inventory';
import Product from '@/models/Product';

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build filter
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (search) {
      filter.productName = { $regex: search, $options: 'i' };
    }
    
    // Get inventory items
    const inventory = await Inventory.find(filter)
      .sort({ createdAt: -1 })
      .populate('productId'); // Populate product details if needed
    
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory" 
    }, { status: 500 });
  }
}

// Update inventory item
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "Inventory ID is required" }, { status: 400 });
    }
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      body.id,
      {
        $set: {
          stock: body.stock,
          status: body.status || (body.stock > 0 ? 'In Stock' : 'Out Of Stock'),
          stockLimit: body.stockLimit,
          sizeStock: body.sizeStock,
          colorStock: body.colorStock,
        }
      },
      { new: true }
    );
    
    if (!updatedInventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
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
