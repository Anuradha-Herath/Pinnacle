import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import Discount from "@/models/Discount"; // Add discount import
import connectDB from "@/lib/optimizedDB"; // Use optimized connection

// First, define a proper interface for your product items
interface ProductItem {
  _id: string;
  productName: string;
  regularPrice: number;
  category: string;
  gallery?: Array<{src: string, color?: string, name?: string}>;
  sizes?: string[];
  // Add other properties as needed
}

// Add CORS headers helper with caching
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=180, stale-while-revalidate=60',
  'CDN-Cache-Control': 'max-age=180',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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
      return NextResponse.json({ products: [] }, {
        headers: corsHeaders,
      });
    }
    
    // Build query to find products that are in stock
    const query: any = { _id: { $in: inStockProductIds } };
    
    // Add category filter if provided - use case-insensitive regex matching
    if (category) {
      // For exact category matching (case-insensitive)
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      
      console.log(`Filtering products by category: ${category}`);
    }
    
    console.log(`Fetching in-stock products with category: ${category || 'All'}`);
    
    // Get active discounts to include in the response
    const today = new Date().toISOString().split('T')[0];
    const activeDiscounts = await Discount.find({
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    // Get products from the database
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    console.log(`Found ${products.length} in-stock products with category: ${category || 'All'}`);
    
    // Transform products to customer format with discount information
    const customerProducts = products.map((item: ProductItem) => {
      // Find applicable discount
      const discount = activeDiscounts.find(
        d => (d.type === 'Product' && d.product === item._id.toString()) ||
             (d.type === 'Category' && d.product === item.category) ||
             (d.type === 'All' && d.applyToAllProducts)
      );
      
      // Calculate discounted price if discount exists
      let discountedPrice = null;
      if (discount) {
        discountedPrice = item.regularPrice - (item.regularPrice * discount.percentage / 100);
        discountedPrice = Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
      }
      
      return {
        id: item._id,
        name: item.productName,
        price: item.regularPrice,
        discountedPrice, // Include calculated discounted price
        category: item.category,
        image: item.gallery && item.gallery.length > 0 ? 
          item.gallery[0].src : '/placeholder.png',
        colors: item.gallery?.map((galleryItem) => galleryItem.src) || [],
        sizes: item.sizes || [],
        // Include discount info for immediate use
        discount: discount ? {
          percentage: discount.percentage,
          discountedPrice
        } : undefined
      };
    });
    
    return NextResponse.json({ products: customerProducts }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch products" 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
