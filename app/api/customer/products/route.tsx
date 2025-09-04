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
  subCategory?: string;
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
    console.log('Starting product fetch request...');
    
    // Connect to the database with proper error handling
    try {
      await connectDB();
      console.log('Database connection successful');
      
      // Verify connection is actually ready
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not ready. ReadyState: ${mongoose.connection.readyState}`);
      }
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    // Get URL parameters
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const subCategory = url.searchParams.get('subCategory');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    console.log(`API Request - Category: ${category}, SubCategory: ${subCategory}, Limit: ${limit}`);
    
    // Find inventory items that are in stock - with fallback to all products if inventory fails
    let inStockProductIds: string[] = [];
    let useInventoryFilter = true;
    
    try {
      const inStockInventory = await Inventory.find({ status: 'In Stock' });
      console.log(`Found ${inStockInventory.length} inventory items in stock`);
      
      if (inStockInventory.length > 0) {
        inStockProductIds = inStockInventory.map(item => item.productId);
      } else {
        // If no inventory found, fall back to all products
        console.log('No inventory items found, falling back to all products');
        useInventoryFilter = false;
      }
    } catch (inventoryError) {
      console.error('Error fetching inventory, falling back to all products:', inventoryError);
      useInventoryFilter = false;
    }
    
    console.log(`Using inventory filter: ${useInventoryFilter}, Product IDs: ${inStockProductIds.length}`);
    
    // Build query - only filter by inventory if we successfully got inventory data
    const query: any = {};
    
    if (useInventoryFilter && inStockProductIds.length > 0) {
      query._id = { $in: inStockProductIds };
    } else {
      console.log('Fetching all products (inventory filter disabled)');
    }
    
    // Add category filter if provided - use case-insensitive regex matching
    if (category) {
      // Handle common variations like "Women" vs "Womens", and "accessories" vs "Accessories"
      let categoryPattern = category;
      if (category.toLowerCase() === 'women') {
        categoryPattern = '(women|womens)';
      } else if (category.toLowerCase() === 'men') {
        categoryPattern = '(men|mens)';
      } else if (category.toLowerCase() === 'accessories') {
        categoryPattern = '(accessories|accessory)';
      }
      
      query.category = { $regex: new RegExp(`^${categoryPattern}$`, 'i') };
      console.log(`Filtering products by category pattern: ${categoryPattern} (original: ${category})`);
    }
    
    // Add subcategory filter if provided
    if (subCategory) {
      query.subCategory = { $regex: new RegExp(`^${subCategory}$`, 'i') };
      console.log(`Filtering products by subcategory: ${subCategory}`);
    }
    
    console.log(`Fetching in-stock products with category: ${category || 'All'}, subCategory: ${subCategory || 'All'}`);
    console.log('Query:', JSON.stringify(query));
    
    // Get active discounts to include in the response
    let activeDiscounts;
    try {
      const today = new Date().toISOString().split('T')[0];
      activeDiscounts = await Discount.find({
        status: 'Active',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });
      console.log(`Found ${activeDiscounts.length} active discounts`);
    } catch (discountError) {
      console.error('Error fetching discounts:', discountError);
      // Continue without discounts rather than failing completely
      activeDiscounts = [];
    }
    
    // Get products from the database
    let products;
    try {
      products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      
      console.log(`Found ${products.length} products with category: ${category || 'All'}, subCategory: ${subCategory || 'All'}`);
      
      // Debug: Log some product details if we found any
      if (products.length > 0) {
        console.log('Sample products found:', products.slice(0, 3).map((p: any) => ({
          id: p._id,
          name: p.productName,
          category: p.category,
          price: p.regularPrice
        })));
      } else {
        console.log('No products found with the given criteria');
        // Debug: Check what products exist in the database
        try {
          const sampleProducts = await Product.find({}).limit(5);
          console.log('Sample of all products in database:', sampleProducts.map((p: any) => ({
            id: p._id,
            name: p.productName,
            category: p.category
          })));
        } catch (debugError) {
          console.error('Error fetching sample products for debug:', debugError);
        }
      }
    } catch (productError) {
      console.error('Error fetching products from database:', productError);
      return NextResponse.json({ 
        error: "Failed to fetch products from database",
        details: productError instanceof Error ? productError.message : String(productError)
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    // Transform products to customer format with discount information
    const customerProducts = products.map((item: ProductItem) => {
      try {
        // Find applicable discount
        const discount = activeDiscounts.find(
          d => (d.type === 'Product' && d.product === item._id.toString()) ||
               (d.type === 'Category' && d.product === item.category) ||
               (d.type === 'All' && d.applyToAllProducts)
        );
        
        // Calculate discounted price if discount exists
        let discountedPrice = null;
        if (discount && item.regularPrice) {
          discountedPrice = item.regularPrice - (item.regularPrice * discount.percentage / 100);
          discountedPrice = Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
        }
        
        return {
          id: item._id,
          name: item.productName,
          price: item.regularPrice || 0,
          discountedPrice, // Include calculated discounted price
          category: item.category,
          subCategory: item.subCategory,
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
      } catch (error) {
        console.error('Error processing product:', item._id, error);
        // Return a safe fallback product
        return {
          id: item._id,
          name: item.productName || 'Unknown Product',
          price: item.regularPrice || 0,
          discountedPrice: null,
          category: item.category || '',
          subCategory: item.subCategory || '',
          image: '/placeholder.png',
          colors: [],
          sizes: [],
          discount: undefined
        };
      }
    });
    
    return NextResponse.json({ products: customerProducts }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("DETAILED ERROR fetching products:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Return more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch products",
      ...(isDevelopment && {
        details: {
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        }
      })
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
