import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

// Connect to MongoDB using Mongoose
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
    // Connect to the database
    await connectDB();
    
    // Get the query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5'); // Smaller limit for suggestions
    
    if (!query || query.length < 2) { // Only return suggestions for 2+ characters
      return NextResponse.json({ suggestions: [] });
    }
    
    // Create a regex search pattern that's case insensitive
    const searchPattern = new RegExp(query, 'i');
    
    // Search for products that match the query in name and tag fields (most relevant for suggestions)
    const products = await Product.find({
      $or: [
        { productName: { $regex: searchPattern } },
        { tag: { $regex: searchPattern } },
        { category: { $regex: searchPattern } }
      ]
    })
    .select('productName gallery') // Only select fields we need for suggestions
    .limit(limit);
    
    // Format the results as simple suggestion objects
    const suggestions = products.map(product => ({
      id: product._id,
      name: product.productName,
      image: product.gallery && product.gallery.length > 0 ? 
        product.gallery[0].src : '/placeholder.png',
    }));
    
    // Also include category and tag suggestions
    const categories = await Product.aggregate([
      { $match: { category: { $regex: searchPattern } } },
      { $group: { _id: "$category" } },
      { $limit: 3 }
    ]);
    
    const categorySuggestions = categories.map(cat => ({
      id: `category-${cat._id}`,
      name: `${cat._id} (Category)`,
      type: 'category'
    }));
    
    return NextResponse.json({ 
      suggestions: [...suggestions, ...categorySuggestions]
    });
    
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch suggestions" 
    }, { status: 500 });
  }
}
