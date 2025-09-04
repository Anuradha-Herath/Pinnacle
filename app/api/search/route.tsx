import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get the query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!query) {
      return NextResponse.json({ products: [] });
    }
    
    // Create a regex search pattern that's case insensitive
    const searchPattern = new RegExp(query, 'i');
    
    // Search for products that match the query in name, description, category, or subcategory
    const products = await Product.find({
      $or: [
        { productName: { $regex: searchPattern } },
        
        { category: { $regex: searchPattern } },
        { subCategory: { $regex: searchPattern } },
        { tag: { $regex: searchPattern } },
      ]
    }).limit(limit);
    
    // Transform products to match client-side format
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.productName,
      price: product.regularPrice,
      image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : '/placeholder.png',
      colors: product.gallery?.map((item: {src: string, name: string, color: string}) => item.src) || [],
      sizes: product.sizes || [],
      category: product.category,
      subCategory: product.subCategory,
    }));
    
    return NextResponse.json({ products: formattedProducts });
    
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to search products" 
    }, { status: 500 });
  }
}
