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
    
    // Find inventory items that are in stock
    let inStockInventory;
    try {
      inStockInventory = await Inventory.find({ status: 'In Stock' });
      console.log(`Found ${inStockInventory.length} inventory items in stock`);
    } catch (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return NextResponse.json({ 
        error: "Failed to fetch inventory data",
        details: inventoryError instanceof Error ? inventoryError.message : String(inventoryError)
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    // Extract product IDs from in-stock inventory
    const inStockProductIds = inStockInventory.map(item => item.productId);
    
    console.log(`Found ${inStockProductIds.length} products in stock`);
    
    if (inStockProductIds.length === 0) {
      console.log('No products in stock, returning empty array');
      return NextResponse.json({ products: [] }, {
        headers: corsHeaders,
      });
    }
    
    // Build query to find products that are in stock
    const query: any = { _id: { $in: inStockProductIds } };
    
    // Add category filter if provided - use case-insensitive regex matching
    if (category) {
      // Handle common variations like "Women" vs "Womens"
      let categoryPattern = category;
      if (category.toLowerCase() === 'women') {
        categoryPattern = '(women|womens)';
      } else if (category.toLowerCase() === 'men') {
        categoryPattern = '(men|mens)';
      }
      
      query.category = { $regex: new RegExp(`^${categoryPattern}$`, 'i') };
      console.log(`Filtering products by category pattern: ${categoryPattern}`);
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
      
      console.log(`Found ${products.length} in-stock products with category: ${category || 'All'}, subCategory: ${subCategory || 'All'}`);
      
      // Debug: Log some product details if we found any
      if (products.length > 0) {
        console.log('Sample products found:', products.slice(0, 3).map(p => ({
          id: p._id,
          name: p.productName,
          category: p.category,
          price: p.regularPrice
        })));
      } else {
        console.log('No products found with the given criteria');
        // Debug: Let's check what products exist in the database
        const allProducts = await Product.find({}).limit(5);
        console.log('Sample of all products in database:', allProducts.map(p => ({
          id: p._id,
          name: p.productName,
          category: p.category
        })));
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
