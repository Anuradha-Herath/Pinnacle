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
      return NextResponse.json({ keywords: [] });
    }
    
    // Create a regex search pattern that's case insensitive
    const searchPattern = new RegExp(query, 'i');
    
    // Find products matching the query
    const products = await Product.find({
      $or: [
        { productName: { $regex: searchPattern } },
        
        { category: { $regex: searchPattern } },
        { subCategory: { $regex: searchPattern } },
        { tag: { $regex: searchPattern } },
      ]
    }).limit(100); // Get a larger sample to extract keywords from
    
    // Extract keywords from products
    const keywordSet = new Set<string>();
    
    // Extract words from product names that match the query
    products.forEach(product => {
      // Process product name
      const productName = product.productName || '';
      const words = productName.split(/\s+/);
      
      words.forEach(word => {
        // Only add words that match the query pattern and are at least 3 characters
        if (word.length >= 3 && searchPattern.test(word)) {
          keywordSet.add(word);
        }
      });
      
      // Also add the category and subcategory if they match
      if (product.category && searchPattern.test(product.category)) {
        keywordSet.add(product.category);
      }
      
      if (product.subCategory && searchPattern.test(product.subCategory)) {
        keywordSet.add(product.subCategory);
      }
      
      // Add tags if they match
      if (product.tag && searchPattern.test(product.tag)) {
        keywordSet.add(product.tag);
      }
    });
    
    // Also add combined terms
    products.forEach(product => {
      const productName = product.productName || '';
      if (searchPattern.test(productName)) {
        // Find the longest matching substring that starts with the query
        const lcQuery = query.toLowerCase();
        const lcName = productName.toLowerCase();
        const startIndex = lcName.indexOf(lcQuery);
        
        if (startIndex !== -1) {
          // Find the end of the word/phrase
          const endIndex = lcName.indexOf(' ', startIndex + lcQuery.length);
          const phrase = productName.substring(
            startIndex, 
            endIndex !== -1 ? endIndex : undefined
          );
          
          if (phrase.length > query.length) {
            keywordSet.add(phrase);
          }
        }
      }
    });
    
    // Convert to array and limit results
    const keywords = Array.from(keywordSet)
      .filter(keyword => keyword.toLowerCase() !== query.toLowerCase()) // Remove exact matches
      .slice(0, limit);
    
    return NextResponse.json({ keywords });
    
  } catch (error) {
    console.error("Error fetching keyword suggestions:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch keyword suggestions" 
    }, { status: 500 });
  }
}
