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

// This endpoint allows querying inventory with specific filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const color = searchParams.get('color');
    const size = searchParams.get('size');
    
    // Build filter based on what's requested
    let filter: any = {};
    let projection: any = {};
    
    if (color && size) {
      // Query for specific color-size combination
      filter = { [`colorSizeStock.${color}.${size}`]: { $exists: true } };
      projection = { productName: 1, [`colorSizeStock.${color}.${size}`]: 1 };
    } else if (color) {
      // Query for just a color
      filter = { [`colorStock.${color}`]: { $exists: true } };
      projection = { productName: 1, [`colorStock.${color}`]: 1 };
    } else if (size) {
      // Query for just a size
      filter = { [`sizeStock.${size}`]: { $exists: true } };
      projection = { productName: 1, [`sizeStock.${size}`]: 1 };
    } else {
      return NextResponse.json({ 
        error: "Please provide at least one filter parameter (color or size)" 
      }, { status: 400 });
    }
    
    // Find inventory items matching the filter
    const items = await Inventory.find(filter, projection);
    
    // Calculate total quantity for the specified combination
    let totalQuantity = 0;
    let itemDetails = [];
    
    items.forEach(item => {
      let quantity = 0;
      
      if (color && size && item.colorSizeStock && item.colorSizeStock[color] && item.colorSizeStock[color][size]) {
        quantity = item.colorSizeStock[color][size];
      } else if (color && item.colorStock && item.colorStock[color]) {
        quantity = item.colorStock[color];
      } else if (size && item.sizeStock && item.sizeStock[size]) {
        quantity = item.sizeStock[size];
      }
      
      totalQuantity += quantity;
      
      itemDetails.push({
        id: item._id,
        productName: item.productName,
        quantity
      });
    });
    
    return NextResponse.json({ 
      totalQuantity,
      count: items.length,
      items: itemDetails
    });
    
  } catch (error) {
    console.error("Error querying inventory:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to query inventory" 
    }, { status: 500 });
  }
}
