import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Create the product
    const product = await Product.create(data);
    
    // Initialize inventory with zero stock and "Newly Added" status
    const inventory = await Inventory.create({
      productId: product._id,
      productName: product.productName,
      stock: 0,
      stockLimit: 100, // Default stock limit
      sizes: product.sizes.map(size => ({
        size,
        stock: 0
      })),
      colors: data.gallery.map(item => ({
        color: item.color,
        stock: 0,
        image: item.src
      })),
      status: "Newly Added"
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Product created and added to inventory",
      product,
      inventory
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      products
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
