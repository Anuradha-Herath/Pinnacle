import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Discount from '@/models/Discount';

// Connect to MongoDB
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

// GET discounts applicable to a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();
    
    // Properly await the params object before accessing productId
    const { productId } = await params;
    
    // Find any active discounts for this specific product
    // Also get category-based discounts that apply to this product's category
    // For this we would need to know the product's category
    
    // For now, let's just check direct product discounts
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const discount = await Discount.findOne({
      product: productId,
      type: 'Product',
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).sort({ percentage: -1 }); // Get the highest discount if multiple exist
    
    if (!discount) {
      return NextResponse.json({ message: "No active discount found for this product" });
    }
    
    return NextResponse.json({ 
      discount: {
        id: discount._id,
        percentage: discount.percentage,
        active: true
      } 
    });
  } catch (error) {
    console.error("Error fetching product discount:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discount information" 
    }, { status: 500 });
  }
}
