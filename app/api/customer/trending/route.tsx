import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import Discount from "@/models/Discount";
import connectDB from "@/lib/optimizedDB"; // Use optimized connection
import { getTrendingFromCache, setTrendingCache } from "@/lib/trendingCache";

// Add CORS headers helper with enhanced caching for trending products
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  // Longer cache time for trending products since they don't change as frequently
  'Cache-Control': 'public, max-age=600, stale-while-revalidate=120',
  'CDN-Cache-Control': 'max-age=900', // 15 minutes CDN cache
  'Surrogate-Control': 'max-age=1200', // 20 minutes for edge CDN if available
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
    console.log('Starting trending products fetch...');
    
    // Check cache first to avoid database queries
    const cachedProducts = getTrendingFromCache();
    if (cachedProducts) {
      console.log('Serving trending products from cache');
      return NextResponse.json({ products: cachedProducts }, {
        headers: {
          ...corsHeaders,
          'X-Cache': 'HIT',
          'X-Cache-Timestamp': new Date().toISOString(),
        }
      });
    }
    
    console.log('Trending cache miss, fetching from database...');
    
    // Connect to the database with error handling
    try {
      await connectDB();
      console.log('Database connected for trending products');
      
      // Verify connection is actually ready
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not ready for trending. ReadyState: ${mongoose.connection.readyState}`);
      }
    } catch (dbError) {
      console.error('Database connection failed for trending:', dbError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    const PRODUCT_LIMIT = 10;
    
    // Get date threshold for recent items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find all inventory items with "In Stock" status - with fallback
    let inStockProductIds: string[] = [];
    let useInventoryFilter = true;
    
    try {
      const inStockInventory = await Inventory.find({
        status: 'In Stock'
      });
      
      if (inStockInventory.length > 0) {
        inStockProductIds = inStockInventory.map(item => item.productId);
        console.log(`Found ${inStockProductIds.length} products in stock for trending`);
      } else {
        console.log('No inventory found, using all products for trending');
        useInventoryFilter = false;
      }
    } catch (inventoryError) {
      console.error('Inventory fetch failed for trending, using all products:', inventoryError);
      useInventoryFilter = false;
    }
    
    // Build the base query based on inventory availability
    let baseQuery: any = {};
    
    if (useInventoryFilter && inStockProductIds.length > 0) {
      baseQuery._id = { $in: inStockProductIds };
      console.log(`Using inventory filter for ${inStockProductIds.length} products`);
    } else {
      console.log('Using all products for trending (no inventory filter)');
    }
    
    // Find all products that match our criteria
    const allProducts = await Product.find(baseQuery).sort({ createdAt: -1 });
    
    if (allProducts.length === 0) {
      return NextResponse.json({ products: [] }, {
        headers: corsHeaders,
      });
    }
    
    // Process trending logic based on inventory availability
    let productsWithTimestamp: { product: any; timestamp: number; }[];
    
    if (useInventoryFilter && inStockProductIds.length > 0) {
      // Separate into new products and recently updated products
      const newProducts = allProducts.filter(product => 
        product.createdAt && product.createdAt >= thirtyDaysAgo
      );
      
      // Get the IDs of new products
      const newProductIds = newProducts.map(product => product._id.toString());
      
      // Get recently updated inventory items that are in stock
      const recentlyUpdatedInventory = await Inventory.find({
        status: 'In Stock',
        updatedAt: { $gte: thirtyDaysAgo }
      }).sort({ updatedAt: -1 });
      
      // Get product IDs from recently updated inventory
      const recentlyUpdatedProductIds = recentlyUpdatedInventory.map(item => 
        item.productId.toString()
      );
      
      // Find products that were recently updated but not newly created
      const recentlyUpdatedProducts = allProducts.filter(product => 
        !newProducts.some(newProduct => newProduct._id.toString() === product._id.toString()) &&
        recentlyUpdatedProductIds.includes(product._id.toString())
      );
      
      // Create a map of products with their most recent timestamp
      productsWithTimestamp = [...newProducts, ...recentlyUpdatedProducts].map(product => {
        const inventoryItem = recentlyUpdatedInventory.find(item => 
          item.productId.toString() === product._id.toString()
        );
        
        const createdAt = product.createdAt ? product.createdAt.getTime() : 0;
        const updatedAt = inventoryItem?.updatedAt ? inventoryItem.updatedAt.getTime() : 0;
        
        return {
          product,
          timestamp: Math.max(createdAt, updatedAt)
        };
      });
    } else {
      // If no inventory filter, just use the newest products
      productsWithTimestamp = allProducts.slice(0, PRODUCT_LIMIT).map(product => ({
        product,
        timestamp: product.createdAt ? product.createdAt.getTime() : 0
      }));
    }
    
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
        tag: "TRENDING",
        // Include discount info for immediate use
        discount: discount ? {
          percentage: discount.percentage,
          discountedPrice
        } : undefined
      };
    });
    
    // Store in cache before returning
    setTrendingCache(customerProducts);
    
    return NextResponse.json({ products: customerProducts }, {
      headers: {
        ...corsHeaders,
        'X-Cache': 'MISS',
        'X-Cache-Timestamp': new Date().toISOString(),
      }
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
