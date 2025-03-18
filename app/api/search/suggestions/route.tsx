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
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }
    
    // Create a regex search pattern that's case insensitive
    const searchPattern = new RegExp(query, 'i');
    
    // Search for product names that match the query
    const products = await Product.find({
      productName: { $regex: searchPattern }
    })
    .limit(limit);
    
    // Return data needed for suggestions including images
    const suggestions = products.map(product => ({
      id: product._id,
      name: product.productName,
      image: product.gallery && product.gallery.length > 0 ? 
        product.gallery[0].src : 
        '/placeholder.png'
    }));
    
    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch search suggestions"
    }, { status: 500 });
  }
}
