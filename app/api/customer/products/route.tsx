import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory"; // Add this import

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
    
    // Find inventory items that are in stock
    const inStockInventory = await Inventory.find({ status: 'In Stock' });
    
    // Extract product IDs from in-stock inventory
    const inStockProductIds = inStockInventory.map(item => item.productId);
    
    if (inStockProductIds.length === 0) {
      return NextResponse.json({ products: [] });
    }
    
    // Build query to find products that are in stock
    const query: any = { _id: { $in: inStockProductIds } };
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    console.log(`Fetching in-stock products with category: ${category || 'All'}`);
    
    // Get products from the database
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log(`Found ${products.length} in-stock products`);
    
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
