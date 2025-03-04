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

// GET a discount by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const discount = await Discount.findById(params.id);
    
    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discount" 
    }, { status: 500 });
  }
}

// PUT (update) a discount by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    const updatedDiscount = await Discount.findByIdAndUpdate(
      params.id,
      {
        product: body.productId,
        type: body.discountType.charAt(0).toUpperCase() + body.discountType.slice(1),
        percentage: body.discountPercentage,
        startDate: body.startDate,
        endDate: body.endDate,
        status: body.discountStatus.charAt(0).toUpperCase() + body.discountStatus.slice(1),
        description: body.description || ''
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Discount updated successfully", 
      discount: updatedDiscount 
    });
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update discount" 
    }, { status: 500 });
  }
}

// DELETE a discount by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const deletedDiscount = await Discount.findByIdAndDelete(params.id);
    
    if (!deletedDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: "Discount deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete discount" 
    }, { status: 500 });
  }
}
