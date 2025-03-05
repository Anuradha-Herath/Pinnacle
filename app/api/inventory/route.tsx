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

// GET all inventory items
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
    
    console.log("Fetching inventory with filter:", filter);
    
    // Get inventory items
    const inventory = await Inventory.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found ${inventory.length} inventory items`);
    
    // Get counts for different statuses
    const totalCount = await Inventory.countDocuments({});
    const inStockCount = await Inventory.countDocuments({ status: 'In Stock' });
    const outOfStockCount = await Inventory.countDocuments({ status: 'Out Of Stock' });
    const newlyAddedCount = await Inventory.countDocuments({ status: 'Newly Added' });
    
    return NextResponse.json({ 
      inventory,
      counts: {
        total: totalCount,
        inStock: inStockCount,
        outOfStock: outOfStockCount,
        newlyAdded: newlyAddedCount
      }
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory" 
    }, { status: 500 });
  }
}

// Update inventory
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    if (!body._id) {
      return NextResponse.json({ error: "Inventory ID is required" }, { status: 400 });
    }
    
    // Find the current inventory item
    const currentInventory = await Inventory.findById(body._id);
    if (!currentInventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }
    
    // Determine the new status based on stock
    let newStatus = currentInventory.status;
    
    // If adding stock and was previously Out of Stock or Newly Added, change to In Stock
    if (body.stock > 0) {
      if (currentInventory.status === 'Out Of Stock' || currentInventory.status === 'Newly Added') {
        newStatus = 'In Stock';
      }
    } else if (body.stock === 0) {
      // If stock is 0, set to Out Of Stock
      newStatus = 'Out Of Stock';
    }
    
    // Update the inventory
    const updateFields = {
      stock: body.stock,
      status: newStatus,
    };
    
    // Only update sizeStock if provided
    if (body.sizeStock) {
      updateFields.sizeStock = body.sizeStock;
    }
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      body._id,
      { $set: updateFields },
      { new: true }
    );
    
    console.log("Updated inventory:", updatedInventory);
    
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
