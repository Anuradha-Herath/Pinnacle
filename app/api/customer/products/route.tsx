import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

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

// GET method to fetch products for customers
export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get URL parameters
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    
    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    
    // Get products from the database
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Transform products to customer format
    const customerProducts = products.map(product => ({
      id: product._id,
      name: product.productName,
      price: product.regularPrice,
      image: product.gallery && product.gallery.length > 0 ? 
        product.gallery[0].src : '/placeholder.png',
      colors: product.gallery.map(item => item.src), // Using images as colors
      sizes: product.sizes || [],
    }));
    
    return NextResponse.json({ products: customerProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch products" 
    }, { status: 500 });
  }
}
