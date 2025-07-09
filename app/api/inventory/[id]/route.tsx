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

// GET single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Fetch inventory with product details
    const inventoryItem = await Inventory.findById(params.id);
    
    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    
    // Log to see if colorSizeStock is included in the response
    console.log("Fetched inventory item with colorSizeStock:", 
      JSON.stringify(inventoryItem.colorSizeStock || {}, null, 2));
    
    return NextResponse.json({ item: inventoryItem });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory item" 
    }, { status: 500 });
  }
}

// DELETE inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Check if the ID is for a product (query param) or inventory item (path param)
    const url = new URL(request.url);
    const isProductId = url.searchParams.get("productId") === "true";
    
    let inventoryItem;
    
    if (isProductId) {
      // Delete by product ID
      console.log(`Deleting inventory by product ID: ${id}`);
      inventoryItem = await Inventory.findOneAndDelete({ productId: id });
    } else {
      // Delete by inventory ID
      console.log(`Deleting inventory by ID: ${id}`);
      inventoryItem = await Inventory.findByIdAndDelete(id);
    }
    
    if (!inventoryItem) {
      return NextResponse.json({ 
        error: isProductId ? "No inventory item found for this product" : "Inventory item not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Inventory item deleted successfully",
      deletedItem: inventoryItem
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete inventory item" 
    }, { status: 500 });
  }
}
