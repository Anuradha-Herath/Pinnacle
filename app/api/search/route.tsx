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
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!query) {
      return NextResponse.json({ products: [] });
    }
    
    // Create multiple search patterns for better matching
    const exactPattern = new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'); // Word boundary match with escaped special chars
    const startsWithPattern = new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'); // Starts with
    const containsPattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // Contains (fallback)
    
    // Use text search for better performance if available
    let products = [];
    
    // First try text search (fastest)
    try {
      if (query.length >= 3) {
        const textSearchResults = await Product.find(
          { $text: { $search: query } },
          { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .skip(offset)
        .limit(limit);
        
        if (textSearchResults.length > 0) {
          products = textSearchResults;
        }
      }
    } catch (error) {
      console.log('Text search not available, falling back to regex search');
    }
    
    // If text search didn't work or didn't find enough results, use regex search
    if (products.length === 0) {
      // Priority-based search - exact matches first, then starts with, then contains
      products = await Product.find({
        $or: [
          { productName: { $regex: exactPattern } },
          { category: { $regex: exactPattern } },
          { subCategory: { $regex: exactPattern } },
          { tag: { $regex: exactPattern } },
        ]
      }).skip(offset).limit(limit);
      
      // If not enough exact matches, add starts-with matches
      if (products.length < limit && offset === 0) {
        const startsWithProducts = await Product.find({
          $and: [
            {
              $or: [
                { productName: { $regex: startsWithPattern } },
                { category: { $regex: startsWithPattern } },
                { subCategory: { $regex: startsWithPattern } },
                { tag: { $regex: startsWithPattern } },
              ]
            },
            {
              _id: { $nin: products.map(p => p._id) } // Exclude already found products
            }
          ]
        }).limit(limit - products.length);
        
        products = [...products, ...startsWithProducts];
      }
      
      // If still not enough, add contains matches
      if (products.length < limit && offset === 0) {
        const containsProducts = await Product.find({
          $and: [
            {
              $or: [
                { productName: { $regex: containsPattern } },
                { category: { $regex: containsPattern } },
                { subCategory: { $regex: containsPattern } },
                { tag: { $regex: containsPattern } },
              ]
            },
            {
              _id: { $nin: products.map(p => p._id) } // Exclude already found products
            }
          ]
        }).limit(limit - products.length);
        
        products = [...products, ...containsProducts];
      }
    }
    
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
    
    // Add cache headers for search results
    const response = NextResponse.json({ products: formattedProducts });
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
    
    return response;
    
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to search products" 
    }, { status: 500 });
  }
}
