import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";

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

// GET method to fetch trending products (newly created + recently stocked) that are in stock
export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get URL parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '12');
    
    // Get date threshold for recent items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find all inventory items with "In Stock" status
    const inStockInventory = await Inventory.find({
      status: 'In Stock'
    });
    
    // Extract the product IDs from in-stock inventory
    const inStockProductIds = inStockInventory.map(item => item.productId);
    
    if (inStockProductIds.length === 0) {
      return NextResponse.json({ products: [] });
    }
    
    // Find all products that are in stock
    const allInStockProducts = await Product.find({
      _id: { $in: inStockProductIds }
    });
    
    // Separate into new products and recently updated products
    const newProducts = allInStockProducts.filter(product => 
      product.createdAt && product.createdAt >= thirtyDaysAgo
    );
    
    // Get the IDs of new products
    const newProductIds = newProducts.map(product => product._id.toString());
    
    // Get recently updated inventory items that are in stock
    const recentlyUpdatedInventory = inStockInventory.filter(item => 
      item.updatedAt && item.updatedAt >= thirtyDaysAgo
    );
    
    // Get product IDs from recently updated inventory
    const recentlyUpdatedProductIds = recentlyUpdatedInventory.map(item => 
      item.productId.toString()
    );
    
    // Find products that were recently updated but not newly created
    const recentlyUpdatedProducts = allInStockProducts.filter(product => 
      !newProducts.some(newProduct => newProduct._id.toString() === product._id.toString()) &&
      recentlyUpdatedProductIds.includes(product._id.toString())
    );
    
    // Identify products that are both newly created AND recently stocked
    const newAndStockedIds = newProductIds.filter(id => recentlyUpdatedProductIds.includes(id));
    
    // Combine new products and recently updated products, and limit to requested number
    const trendingProducts = [...newProducts, ...recentlyUpdatedProducts].slice(0, limit);
    
    // Transform products to customer format
    const customerProducts = trendingProducts.map(product => {
      const isNewAndStocked = newAndStockedIds.includes(product._id.toString());
      
      return {
        id: product._id,
        name: product.productName,
        price: product.regularPrice,
        image: product.gallery && product.gallery.length > 0 ? 
          product.gallery[0].src : '/placeholder.png',
        colors: product.gallery.map(item => item.src),
        sizes: product.sizes || [],
        tag: isNewAndStocked ? "NEW" : null, // Add NEW tag if product is both new and stocked
      };
    });
    
    return NextResponse.json({ products: customerProducts });
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch trending products" 
    }, { status: 500 });
  }
}
