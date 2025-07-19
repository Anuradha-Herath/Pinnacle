import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Inventory from "@/models/Inventory";
import Discount from "@/models/Discount";
import connectDB from "@/lib/optimizedDB";

// Add CORS headers helper with caching for best sellers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutes cache
  'CDN-Cache-Control': 'max-age=600', // 10 minutes for CDN
  'Vary': 'Accept-Encoding',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET method to fetch best-selling products by category
export async function GET(request: NextRequest) {
  try {
    console.log('Starting best sellers fetch...');
    
    // Connect to the database with error handling
    try {
      await connectDB();
      console.log('Database connected for best sellers');
      
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not ready for best sellers. ReadyState: ${mongoose.connection.readyState}`);
      }
    } catch (dbError) {
      console.error('Database connection failed for best sellers:', dbError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }

    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category'); // 'Men', 'Women', or null for all
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log(`Fetching best sellers for category: ${category || 'all'}, limit: ${limit}`);

    // Get date range for sales analysis (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // First, get in-stock product IDs
    let inStockProductIds: string[] = [];
    try {
      const inStockInventory = await Inventory.find({
        status: 'In Stock'
      }).select('productId');
      
      inStockProductIds = inStockInventory.map(item => item.productId.toString());
      console.log(`Found ${inStockProductIds.length} in-stock products`);
    } catch (inventoryError) {
      console.error('Inventory fetch failed for best sellers:', inventoryError);
      // Continue without inventory filter if there's an error
    }

    // Aggregate orders to find best-selling products
    const salesAggregation: any[] = [
      // Match orders from the last 90 days with paid payment status
      {
        $match: {
          createdAt: { $gte: ninetyDaysAgo },
          paymentStatus: 'paid', // Only orders with confirmed payment
        },
      },
      // Unwind line items to process each product separately
      {
        $unwind: "$line_items",
      },
      // Group by product ID and sum quantities
      {
        $group: {
          _id: "$line_items.metadata.productId",
          totalSold: { $sum: "$line_items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: [
                "$line_items.quantity",
                "$line_items.price_data.unit_amount",
              ],
            },
          },
        },
      },
      // Sort by total sold (descending)
      {
        $sort: { totalSold: -1 },
      },
      // Limit to top selling products
      {
        $limit: limit * 3, // Get more than needed to account for filtering
      },
    ];

    console.log('Executing sales aggregation...');
    const salesData = await Order.aggregate(salesAggregation);
    console.log(`Found ${salesData.length} products with sales data`);

    if (salesData.length === 0) {
      // If no sales data, fallback to newest in-stock products
      console.log('No sales data found, falling back to newest products');
      return await getFallbackBestSellers(category, limit, inStockProductIds);
    }

    // Extract product IDs from sales data
    const bestSellingProductIds = salesData
      .map(item => item._id)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));

    // Build product query
    let productQuery: any = {
      _id: { $in: bestSellingProductIds }
    };

    // Filter by in-stock status if we have inventory data
    if (inStockProductIds.length > 0) {
      productQuery._id.$in = productQuery._id.$in.filter((id: string) => 
        inStockProductIds.includes(id)
      );
    }

    // Add category filter if specified
    if (category && (category === 'Men' || category === 'Women')) {
      productQuery.category = new RegExp(`^${category}$`, 'i');
      console.log(`Filtering by category: ${category}`);
    }

    console.log(`Fetching products with query:`, JSON.stringify(productQuery));

    // Fetch products
    const products = await Product.find(productQuery)
      .select('productName description category subCategory regularPrice gallery sizes createdAt _id')
      .lean()
      .exec();

    console.log(`Found ${products.length} products matching criteria`);

    if (products.length === 0) {
      // Fallback if no products match the criteria
      return await getFallbackBestSellers(category, limit, inStockProductIds);
    }

    // Create a map of sales data for quick lookup
    const salesMap = new Map(salesData.map(item => [item._id, item]));

    // Sort products by their sales performance
    const productsWithSales = products
      .map((product: any) => ({
        ...product,
        salesData: salesMap.get(product._id.toString()) || { totalSold: 0, totalRevenue: 0 }
      }))
      .sort((a: any, b: any) => b.salesData.totalSold - a.salesData.totalSold);
    
    // Remove duplicates and limit
    const uniqueProducts = productsWithSales.filter((product, index, self) => 
      self.findIndex((p: any) => p._id.toString() === product._id.toString()) === index
    );
    const sortedProducts = uniqueProducts.slice(0, limit);

    // Get active discounts
    const today = new Date().toISOString().split('T')[0];
    const activeDiscounts = await Discount.find({
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).lean();

    // Transform products to customer format with discount information
    const customerProducts = sortedProducts.map((product: any) => {
      // Find applicable discount
      const discount = activeDiscounts.find(
        (d: any) => (d.type === 'Product' && d.product === product._id.toString()) ||
             (d.type === 'Category' && d.product === product.category) ||
             (d.type === 'Sub-category' && d.product === product.subCategory) ||
             (d.type === 'All' && d.applyToAllProducts)
      );

      // Calculate discounted price if discount exists
      let discountedPrice = null;
      if (discount) {
        discountedPrice = product.regularPrice - (product.regularPrice * discount.percentage / 100);
        discountedPrice = Math.round(discountedPrice * 100) / 100;
      }

      return {
        id: product._id,
        name: product.productName,
        price: product.regularPrice,
        discountedPrice,
        image: product.gallery && product.gallery.length > 0 ? 
          product.gallery[0].src : '/placeholder.png',
        colors: product.gallery?.map((item: any) => item.src) || [],
        sizes: product.sizes || [],
        category: product.category,
        subCategory: product.subCategory,
        tag: "BEST SELLER",
        salesCount: product.salesData.totalSold,
        // Include discount info for immediate use
        discount: discount ? {
          percentage: discount.percentage,
          discountedPrice
        } : undefined
      };
    });

    console.log(`Returning ${customerProducts.length} best-selling products`);

    return NextResponse.json({ products: customerProducts }, {
      headers: {
        ...corsHeaders,
        'X-Products-Count': customerProducts.length.toString(),
        'X-Category': category || 'all',
      }
    });

  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch best sellers" 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}

// Fallback function to get newest in-stock products when no sales data is available
async function getFallbackBestSellers(category: string | null, limit: number, inStockProductIds: string[]) {
  console.log('Using fallback best sellers logic');
  
  let productQuery: any = {};

  // Filter by in-stock status if we have inventory data
  if (inStockProductIds.length > 0) {
    productQuery._id = { $in: inStockProductIds };
  }

  // Add category filter if specified
  if (category && (category === 'Men' || category === 'Women')) {
    productQuery.category = new RegExp(`^${category}$`, 'i');
  }
  // For null category, get products from all categories

  const products = await Product.find(productQuery)
    .select('productName description category subCategory regularPrice gallery sizes createdAt _id')
    .sort({ createdAt: -1 }) // Newest first as fallback
    .limit(limit)
    .lean()
    .exec();

  // Remove duplicates
  const uniqueProducts = products.filter((product, index, self) => 
    self.findIndex((p: any) => (p as any)._id.toString() === (product as any)._id.toString()) === index
  );

  const finalProducts = uniqueProducts.slice(0, limit);

  // Get active discounts
  const today = new Date().toISOString().split('T')[0];
  const activeDiscounts = await Discount.find({
    status: 'Active',
    startDate: { $lte: today },
    endDate: { $gte: today }
  }).lean();

  // Transform products to customer format
  const customerProducts = finalProducts.map((product: any) => {
    const discount = activeDiscounts.find(
      (d: any) => (d.type === 'Product' && d.product === product._id.toString()) ||
           (d.type === 'Category' && d.product === product.category) ||
           (d.type === 'Sub-category' && d.product === product.subCategory) ||
           (d.type === 'All' && d.applyToAllProducts)
    );

    let discountedPrice = null;
    if (discount) {
      discountedPrice = product.regularPrice - (product.regularPrice * discount.percentage / 100);
      discountedPrice = Math.round(discountedPrice * 100) / 100;
    }

    return {
      id: product._id,
      name: product.productName,
      price: product.regularPrice,
      discountedPrice,
      image: product.gallery && product.gallery.length > 0 ? 
        product.gallery[0].src : '/placeholder.png',
      colors: product.gallery?.map((item: any) => item.src) || [],
      sizes: product.sizes || [],
      category: product.category,
      subCategory: product.subCategory,
      tag: "BEST SELLER",
      salesCount: 0,
      discount: discount ? {
        percentage: discount.percentage,
        discountedPrice
      } : undefined
    };
  });

  return NextResponse.json({ products: customerProducts }, {
    headers: {
      ...corsHeaders,
      'X-Products-Count': customerProducts.length.toString(),
      'X-Category': category || 'all',
      'X-Fallback': 'true',
    }
  });
}
