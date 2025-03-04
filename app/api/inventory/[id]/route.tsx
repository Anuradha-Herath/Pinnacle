import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

// GET a single inventory item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }
    
    const inventoryItem = await Inventory.findById(id).populate('productId');
    
    if (!inventoryItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    
    return NextResponse.json({ inventoryItem });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch inventory item" 
    }, { status: 500 });
  }
}

// UPDATE an inventory item by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }
    
    const body = await request.json();
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id, 
      {
        quantity: body.quantity,
        tags: body.tags,
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
    console.error("Error updating inventory item:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update inventory item" 
    }, { status: 500 });
  }
}

// DELETE an inventory item by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid inventory ID" }, { status: 400 });
    }
    
    const deletedInventory = await Inventory.findByIdAndDelete(id);
    
    if (!deletedInventory) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete inventory item" 
    }, { status: 500 });
  }
}
