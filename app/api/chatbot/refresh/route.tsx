import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
// Import the shared cache from the main chatbot route
import { 
  productCache, 
  lastCacheUpdate, 
  fetchFreshProductData, 
  knownCategories, 
  knownSubCategories 
} from "../route";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Force refresh the product cache
    const products = await fetchFreshProductData(true);
    
    // Get the categories and subcategories information
    const categories = Array.from(knownCategories);
    const subCategories = Array.from(knownSubCategories);
    
    // Check if any products have been created recently (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentProducts = products.filter(p => {
      const createdAt = new Date(p.createdAt);
      return createdAt > oneDayAgo;
    });
    
    console.log(`Cache refreshed. Found ${products.length} total products`);
    console.log(`Known categories: ${categories.join(', ')}`);
    console.log(`Known subcategories: ${subCategories.join(', ')}`);
    console.log(`Recent products (24h): ${recentProducts.length}`);
    
    if (recentProducts.length > 0) {
      console.log("Recent products:", recentProducts.map(p => p.productName).join(', '));
    }
    
    return NextResponse.json({
      success: true,
      message: "Product cache refreshed successfully",
      productCount: products.length,
      timestamp: new Date().toISOString(),
      categories: categories,
      subCategories: subCategories,
      recentProducts: recentProducts.length
    });
    
  } catch (error) {
    console.error("Error refreshing product cache:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
