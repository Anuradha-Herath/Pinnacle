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

// Helper function to validate and get top N items from a preferences object
const getTopPreferences = (preferencesObj: Record<string, number>, count: number = 3): [string, number][] => {
  return Object.entries(preferencesObj || {})
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, count);
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Parse the request body to get user preferences
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences) {
      return NextResponse.json({ 
        error: "No user preferences provided" 
      }, { status: 400 });
    }

    // Get top preferences for different aspects
    const topCategories = getTopPreferences(preferences.categories);
    const topProducts = getTopPreferences(preferences.products);
    const topColors = getTopPreferences(preferences.colors);
    
    // Base query for products
    let query: any = {};
    let products: any[] = [];
    
    // Try different strategies to find relevant recommendations
    
    // Strategy 1: Find similar products based on previously viewed product IDs
    if (topProducts.length > 0) {
      // Extract product IDs the user has interacted with
      const viewedProductIds = topProducts.map(([id]) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      // Get category information for these products to find similar ones
      if (viewedProductIds.length > 0) {
        const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } })
          .select('category subCategory');
        
        // Extract categories from viewed products
        const categories = viewedProducts.map(p => p.category);
        const subCategories = viewedProducts.map(p => p.subCategory);
        
        // Find similar products but exclude already viewed ones
        const similarProducts = await Product.find({
          $or: [
            { category: { $in: categories } },
            { subCategory: { $in: subCategories } }
          ],
          _id: { $nin: viewedProductIds }
        })
        .sort({ createdAt: -1 })
        .limit(8);
        
        products = similarProducts;
      }
    }
    
    // Strategy 2: If no results yet, try finding products by top categories
    if (products.length === 0 && topCategories.length > 0) {
      const categoryNames = topCategories.map(([name]) => 
        new RegExp(name, 'i') // Case-insensitive search
      );
      
      products = await Product.find({
        $or: [
          { category: { $in: categoryNames } },
          { subCategory: { $in: categoryNames } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(8);
    }
    
    // Strategy 3: If still no results, try finding products by color preferences
    if (products.length === 0 && topColors.length > 0) {
      const colorNames = topColors.map(([colorName]) => 
        new RegExp(colorName, 'i') // Case-insensitive match
      );
      
      products = await Product.find({
        "gallery.color": { $in: colorNames }
      })
      .sort({ createdAt: -1 })
      .limit(8);
    }
    
    // Strategy 4: If all else fails, return newest products as fallback
    if (products.length === 0) {
      products = await Product.find()
        .sort({ createdAt: -1 })
        .limit(8);
    }
    
    // Format the products for the frontend
    const recommendations = products.map(product => ({
      id: product._id,
      name: product.productName,
      price: product.regularPrice.toFixed(2),
      image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : null,
      category: product.category,
      subCategory: product.subCategory
    }));
    
    // Return randomized subset of the recommendations (up to 4 products)
    const shuffled = recommendations.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(4, shuffled.length));
    
    return NextResponse.json({
      success: true,
      recommendations: selected,
      strategy: {
        usedProductHistory: topProducts.length > 0,
        usedCategories: topCategories.length > 0,
        usedColors: topColors.length > 0
      }
    });
    
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate recommendations" 
    }, { status: 500 });
  }
}
