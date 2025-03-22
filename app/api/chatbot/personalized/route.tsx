import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

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
    
    // Get user preferences from request body
    const { preferences } = await request.json();
    
    if (!preferences) {
      return NextResponse.json({ error: "User preferences not provided" }, { status: 400 });
    }
    
    // Extract user preference data
    const { viewedProducts, likedProducts, preferredCategories, preferredStyles, preferredSeasons, preferredOccasions, preferredColors } = preferences;
    
    // Build a query based on user preferences
    const query: any = { $or: [] };
    
    // Add products from categories the user has shown interest in
    if (Object.keys(preferredCategories).length > 0) {
      // Get top 3 preferred categories by weight
      const topCategories = Object.entries(preferredCategories)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([category]) => category);
        
      if (topCategories.length > 0) {
        query.$or.push({ 
          $or: [
            { category: { $in: topCategories } },
            { subCategory: { $in: topCategories } }
          ]
        });
      }
    }
    
    // Add products with preferred styles
    if (preferredStyles?.length > 0) {
      query.$or.push({ style: { $in: preferredStyles } });
    }
    
    // Add products with preferred seasons
    if (preferredSeasons?.length > 0) {
      query.$or.push({ season: { $in: preferredSeasons } });
    }
    
    // Add products with preferred occasions
    if (preferredOccasions?.length > 0) {
      query.$or.push({ occasions: { $in: preferredOccasions } });
    }
    
    // Add products with preferred colors
    if (preferredColors?.length > 0) {
      query.$or.push({ "gallery.color": { $in: preferredColors } });
    }
    
    // If we have no preference data yet, remove the $or condition
    if (query.$or.length === 0) {
      delete query.$or;
    }
    
    // Create a list of product IDs to exclude (recently viewed)
    const viewedProductIds = viewedProducts?.map((p: any) => p.id) || [];
    if (viewedProductIds.length > 0) {
      query._id = { $nin: viewedProductIds };
    }
    
    // Find products based on preferences, limit to 10
    const products = await Product.find(query)
      .limit(10)
      .sort({ createdAt: -1 }) // Prioritize newer products
      .lean();
    
    // If not enough products found, supplement with recent products
    if (products.length < 5) {
      const additionalProducts = await Product.find({ _id: { $nin: [...viewedProductIds, ...products.map(p => p._id)] } })
        .limit(5 - products.length)
        .sort({ createdAt: -1 })
        .lean();
      
      products.push(...additionalProducts);
    }
    
    return NextResponse.json({
      success: true,
      personalizedProducts: products
    });
    
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get personalized recommendations" 
    }, { status: 500 });
  }
}
