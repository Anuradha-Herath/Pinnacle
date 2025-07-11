import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import Discount from "@/models/Discount";
import connectDB from "@/lib/optimizedDB"; // Use optimized connection

// Add CORS headers helper with caching
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  'CDN-Cache-Control': 'max-age=300',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET method to fetch trending products (newly created + recently stocked) that are in stock
export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Hard limit to exactly 10 products
    const PRODUCT_LIMIT = 10;
    
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
      return NextResponse.json({ products: [] }, {
        headers: corsHeaders,
      });
    }
    
    // Find all products that are in stock
    const allInStockProducts = await Product.find({
      _id: { $in: inStockProductIds }
    }).sort({ createdAt: -1 }); // Sort by creation date, newest first
    
    // Separate into new products and recently updated products
    const newProducts = allInStockProducts.filter(product => 
      product.createdAt && product.createdAt >= thirtyDaysAgo
    );
    
    // Get the IDs of new products
    const newProductIds = newProducts.map(product => product._id.toString());
    
    // Get recently updated inventory items that are in stock
    const recentlyUpdatedInventory = inStockInventory.filter(item => 
      item.updatedAt && item.updatedAt >= thirtyDaysAgo
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Sort by update date, newest first
    
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
    
    // Create a map of products with their most recent timestamp (either created or updated)
    const productsWithTimestamp = [...newProducts, ...recentlyUpdatedProducts].map(product => {
      // Find the matching inventory item to get its update timestamp
      const inventoryItem = recentlyUpdatedInventory.find(item => 
        item.productId.toString() === product._id.toString()
      );
      
      // Use the more recent of the two timestamps
      const createdAt = product.createdAt ? product.createdAt.getTime() : 0;
      const updatedAt = inventoryItem?.updatedAt ? inventoryItem.updatedAt.getTime() : 0;
      const timestamp = Math.max(createdAt, updatedAt);
      
      return { product, timestamp };
    });
    
    // Get active discounts
    const today = new Date().toISOString().split('T')[0];
    const activeDiscounts = await Discount.find({
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    // Sort by timestamp (most recent first) and limit to exactly 10 products
    const sortedProducts = productsWithTimestamp
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, PRODUCT_LIMIT)
      .map(item => item.product);
    
    // Transform products to customer format with discount information
    const customerProducts = sortedProducts.map(product => {
      const isNewAndStocked = newAndStockedIds.includes(product._id.toString());
      
      // Find applicable discount
      const discount = activeDiscounts.find(
        d => (d.type === 'Product' && d.product === product._id.toString()) ||
             (d.type === 'Category' && d.product === product.category) ||
             (d.type === 'All' && d.applyToAllProducts)
      );
      
      // Calculate discounted price if discount exists
      let discountedPrice = null;
      if (discount) {
        discountedPrice = product.regularPrice - (product.regularPrice * discount.percentage / 100);
        discountedPrice = Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
      }
      
      return {
        id: product._id,
        name: product.productName,
        price: product.regularPrice,
        discountedPrice, // Include calculated discounted price
        image: product.gallery && product.gallery.length > 0 ? 
          product.gallery[0].src : '/placeholder.png',
        colors: product.gallery?.map((item: any) => item.src) || [],
        sizes: product.sizes || [],
        tag: isNewAndStocked ? "NEW" : null,
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
    console.error("Error fetching trending products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch trending products" 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
