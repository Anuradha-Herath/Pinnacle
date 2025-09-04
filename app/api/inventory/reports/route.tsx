import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Inventory from '@/models/Inventory';

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    // Access search parameters asynchronously
    const reportType = await searchParams.get('type') || 'colorSize';
    
    let results;
    
    switch (reportType) {
      case 'colorSize':
        // This query summarizes all color-size combinations across all products
        results = await Inventory.aggregate([
          { $project: {
              productName: 1,
              colorSizeEntries: { $objectToArray: "$colorSizeStock" }
          }},
          { $unwind: "$colorSizeEntries" },
          { $project: {
              productName: 1,
              color: "$colorSizeEntries.k",
              sizeQuantities: { $objectToArray: "$colorSizeEntries.v" }
          }},
          { $unwind: "$sizeQuantities" },
          { $group: {
              _id: {
                color: "$color",
                size: "$sizeQuantities.k"
              },
              totalQuantity: { $sum: "$sizeQuantities.v" },
              products: { $addToSet: "$productName" }
          }},
          { $project: {
              _id: 0,
              color: "$_id.color",
              size: "$_id.size",
              totalQuantity: 1,
              productCount: { $size: "$products" }
          }},
          { $sort: { color: 1, size: 1 } }
        ]);
        break;
        
      // Add other report types as needed
      
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
    
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to generate report" 
    }, { status: 500 });
  }
}
