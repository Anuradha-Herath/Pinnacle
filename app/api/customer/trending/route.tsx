import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import Order from "@/models/Order";
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

// GET method to fetch trending products (mix of top-selling, newly created, and recently stocked items)
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
    
    // Get date thresholds
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Find all inventory items with "In Stock" status
    let inStockProductIds: string[] = [];
    let useInventoryFilter = true;
    
    try {
      const inStockInventory = await Inventory.find({
        status: 'In Stock'
      }).select('productId');
      
      if (inStockInventory.length > 0) {
        inStockProductIds = inStockInventory.map(item => item.productId.toString());
        console.log(`Found ${inStockProductIds.length} in-stock products for trending`);
      } else {
        console.log('No in-stock inventory found, using all products');
        useInventoryFilter = false;
      }
    } catch (inventoryError) {
      console.error('Inventory fetch failed for trending, using all products:', inventoryError);
      useInventoryFilter = false;
    }

    // Get sales data for trending calculation (last 60 days for trending)
    let topSellingProductIds: string[] = [];
    try {
      const salesAggregation = [
        {
          $match: {
            createdAt: { $gte: ninetyDaysAgo },
            status: { $in: ['confirmed', 'shipped', 'delivered'] }
          }
        },
        {
          $unwind: '$line_items'
        },
        {
          $group: {
            _id: '$line_items.metadata.productId',
            totalSold: { $sum: '$line_items.quantity' },
            recentSales: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', thirtyDaysAgo] },
                  '$line_items.quantity',
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { recentSales: -1, totalSold: -1 }
        },
        {
          $limit: 15 // Get top 15 selling products
        }
      ];

      const salesData = await Order.aggregate(salesAggregation);
      topSellingProductIds = salesData
        .map(item => item._id)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id));
      
      console.log(`Found ${topSellingProductIds.length} top-selling products`);
    } catch (salesError) {
      console.error('Sales aggregation failed, skipping sales data:', salesError);
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
    const allProducts = await Product.find(baseQuery)
      .select('productName description category subCategory regularPrice gallery sizes createdAt _id')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    if (allProducts.length === 0) {
      return NextResponse.json({ products: [] }, {
        headers: corsHeaders,
      });
    }

    // Categorize products for balanced trending mix
    const categorizedProducts = {
      men: allProducts.filter(p => p.category && p.category.toLowerCase().includes('men')),
      women: allProducts.filter(p => p.category && p.category.toLowerCase().includes('women')),
      accessories: allProducts.filter(p => p.category && p.category.toLowerCase().includes('accessories'))
    };

    console.log(`Categorized products: Men: ${categorizedProducts.men.length}, Women: ${categorizedProducts.women.length}, Accessories: ${categorizedProducts.accessories.length}`);

    // Create trending score for each product
    let productsWithScore: { product: any; score: number; category: string; }[] = [];
    
    allProducts.forEach(product => {
      let score = 0;
      const productId = product._id.toString();
      const category = product.category?.toLowerCase() || '';
      
      // Base recency score (newer products get higher score)
      const daysSinceCreated = product.createdAt ? 
        (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24) : 999;
      const recencyScore = Math.max(0, 100 - daysSinceCreated);
      score += recencyScore * 0.3; // 30% weight for recency
      
      // Sales performance score
      const salesIndex = topSellingProductIds.indexOf(productId);
      if (salesIndex !== -1) {
        const salesScore = (topSellingProductIds.length - salesIndex) * 10;
        score += salesScore * 0.5; // 50% weight for sales performance
      }
      
      // Category diversity bonus (ensure mix of categories)
      if (category.includes('men')) {
        score += 10; // Small bonus for men's products
      } else if (category.includes('women')) {
        score += 15; // Slightly higher bonus for women's products
      } else if (category.includes('accessories')) {
        score += 12; // Bonus for accessories
      }
      
      // Recent stock update bonus
      if (useInventoryFilter && inStockProductIds.includes(productId)) {
        score += 20; // 20% bonus for being in stock
      }

      productsWithScore.push({
        product,
        score,
        category: category.includes('men') ? 'men' : 
                 category.includes('women') ? 'women' : 
                 category.includes('accessories') ? 'accessories' : 'other'
      });
    });

    // Sort by score and ensure category diversity
    productsWithScore.sort((a, b) => b.score - a.score);
    
    // Select products ensuring category balance
    const selectedProducts: any[] = [];
    const categoryLimits = {
      women: Math.ceil(PRODUCT_LIMIT * 0.4), // 40% women
      men: Math.ceil(PRODUCT_LIMIT * 0.35),   // 35% men  
      accessories: Math.ceil(PRODUCT_LIMIT * 0.25) // 25% accessories
    };
    
    const categoryCounts = { women: 0, men: 0, accessories: 0 };
    
    // First pass: fill up to category limits
    for (const item of productsWithScore) {
      if (selectedProducts.length >= PRODUCT_LIMIT) break;
      
      const cat = item.category as keyof typeof categoryCounts;
      if (cat in categoryCounts && categoryCounts[cat] < categoryLimits[cat]) {
        selectedProducts.push(item.product);
        categoryCounts[cat]++;
      }
    }
    
    // Second pass: fill remaining slots with highest scoring products (ensure no duplicates)
    for (const item of productsWithScore) {
      if (selectedProducts.length >= PRODUCT_LIMIT) break;
      
      if (!selectedProducts.find(p => p._id.toString() === item.product._id.toString())) {
        selectedProducts.push(item.product);
      }
    }
    
    // Ensure we have exactly PRODUCT_LIMIT products and no duplicates
    const uniqueProducts = selectedProducts.filter((product, index, self) => 
      self.findIndex(p => p._id.toString() === product._id.toString()) === index
    );
    const finalProducts = uniqueProducts.slice(0, PRODUCT_LIMIT);
    
    console.log(`Selected ${finalProducts.length} trending products with category distribution:`, 
      `Women: ${categoryCounts.women}, Men: ${categoryCounts.men}, Accessories: ${categoryCounts.accessories}`);
    
    // Get active discounts
    const today = new Date().toISOString().split('T')[0];
    const activeDiscounts = await Discount.find({
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });
    
    // Transform products to customer format with discount information
    const customerProducts = finalProducts.map(product => {
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
