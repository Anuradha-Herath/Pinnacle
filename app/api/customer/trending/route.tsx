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

// GET method to fetch trending products based on sales data from Men, Women, and Accessories categories
export async function GET(request: Request) {
  try {
    console.log('Starting trending products fetch based on sales...');

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
    const PRODUCTS_PER_CATEGORY = 4; // 4 from each category (Men, Women, Accessories)

    // Get date threshold for recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate sales data by product and category
    let salesData: any[] = [];
    try {
      if (mongoose.connection.db) {
        salesData = await mongoose.connection.db.collection('orders').aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              paymentStatus: 'paid',
              status: { $in: ['Paid', 'Processing', 'Shipped', 'Delivered'] }
            }
          },
          {
            $unwind: '$line_items'
          },
          {
            $lookup: {
              from: 'products',
              localField: 'line_items.productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $unwind: '$product'
          },
          {
            $group: {
              _id: {
                productId: '$line_items.productId',
                category: '$product.category'
              },
              totalSold: { $sum: '$line_items.quantity' },
              productName: { $first: '$product.productName' },
              regularPrice: { $first: '$product.regularPrice' },
              gallery: { $first: '$product.gallery' },
              sizes: { $first: '$product.sizes' },
              createdAt: { $first: '$product.createdAt' }
            }
          },
          {
            $sort: { totalSold: -1 }
          }
        ]).toArray();
      }
    } catch (error) {
      console.log('No orders collection or aggregation failed, will use fallback logic:', error instanceof Error ? error.message : String(error));
      salesData = [];
    }

    console.log(`Found ${salesData.length} products with sales data`);

    // If no sales data, get recent products from each category
    if (salesData.length === 0) {
      console.log('No sales data found, using recent products from each category');

      const categories = ['Men', 'Women', 'Accessories'];
      const selectedProducts: any[] = [];

      for (const category of categories) {
        const categoryProducts = await Product.find({
          $or: [
            { category: category },
            { category: category.toLowerCase() }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(PRODUCTS_PER_CATEGORY);

        categoryProducts.forEach(product => {
          selectedProducts.push({
            productId: product._id,
            name: product.productName,
            price: product.regularPrice,
            totalSold: 0,
            gallery: product.gallery,
            sizes: product.sizes,
            createdAt: product.createdAt,
            category: category
          });
        });
      }

      // Randomize the order for variety
      const finalProducts = selectedProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, PRODUCT_LIMIT);

      console.log(`Selected ${finalProducts.length} recent products from categories`);

      // Get active discounts and transform products
      const today = new Date().toISOString().split('T')[0];
      const activeDiscounts = await Discount.find({
        status: 'Active',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      const customerProducts = finalProducts.map(product => {
        const discount = activeDiscounts.find(
          d => (d.type === 'Product' && d.product === product.productId.toString()) ||
               (d.type === 'Category' && d.product === product.category) ||
               (d.type === 'All' && d.applyToAllProducts)
        );

        let discountedPrice = null;
        if (discount) {
          discountedPrice = product.price - (product.price * discount.percentage / 100);
          discountedPrice = Math.round(discountedPrice * 100) / 100;
        }

        return {
          id: product.productId,
          name: product.name,
          price: product.price,
          discountedPrice,
          image: product.gallery && product.gallery.length > 0 ?
            product.gallery[0].src : '/placeholder.png',
          colors: product.gallery?.map((item: any) => item.src) || [],
          sizes: product.sizes || [],
          tag: "TRENDING",
          discount: discount ? {
            percentage: discount.percentage,
            discountedPrice
          } : undefined,
          totalSold: product.totalSold
        };
      });

      setTrendingCache(customerProducts);
      return NextResponse.json({ products: customerProducts }, {
        headers: {
          ...corsHeaders,
          'X-Cache': 'MISS',
          'X-Cache-Timestamp': new Date().toISOString(),
        }
      });
    }

    // Group products by category
    const categoryProducts: { [key: string]: any[] } = {
      Men: [],
      Women: [],
      Accessories: []
    };

    // Map category names to match our grouping
    const categoryMapping: { [key: string]: string } = {
      'Men': 'Men',
      'Women': 'Women',
      'Accessories': 'Accessories',
      'men': 'Men',
      'women': 'Women',
      'accessories': 'Accessories'
    };

    salesData.forEach((item: any) => {
      const category = categoryMapping[item._id.category] || item._id.category;
      if (categoryProducts[category]) {
        categoryProducts[category].push({
          productId: item._id.productId,
          name: item.productName,
          price: item.regularPrice,
          totalSold: item.totalSold,
          gallery: item.gallery,
          sizes: item.sizes,
          createdAt: item.createdAt
        });
      }
    });

    console.log('Sales by category:', {
      Men: categoryProducts.Men.length,
      Women: categoryProducts.Women.length,
      Accessories: categoryProducts.Accessories.length
    });

    // Select top products from each category
    const selectedProducts: any[] = [];

    // Get top products from each category
    Object.keys(categoryProducts).forEach(category => {
      const products = categoryProducts[category]
        .sort((a: any, b: any) => b.totalSold - a.totalSold)
        .slice(0, PRODUCTS_PER_CATEGORY);

      selectedProducts.push(...products);
    });

    // If we don't have enough products from sales, fill with recent products
    if (selectedProducts.length < PRODUCT_LIMIT) {
      console.log(`Only ${selectedProducts.length} products from sales, filling with recent products`);

      const existingProductIds = selectedProducts.map(p => p.productId);

      // Get recent products not already included
      const recentProducts = await Product.find({
        _id: { $nin: existingProductIds },
        category: { $in: ['Men', 'Women', 'Accessories', 'men', 'women', 'accessories'] }
      })
      .sort({ createdAt: -1 })
      .limit(PRODUCT_LIMIT - selectedProducts.length);

      recentProducts.forEach(product => {
        selectedProducts.push({
          productId: product._id,
          name: product.productName,
          price: product.regularPrice,
          totalSold: 0, // No sales data
          gallery: product.gallery,
          sizes: product.sizes,
          createdAt: product.createdAt
        });
      });
    }

    // Limit to PRODUCT_LIMIT and randomize order slightly for variety
    const finalProducts = selectedProducts
      .slice(0, PRODUCT_LIMIT)
      .sort(() => Math.random() - 0.5); // Randomize order

    console.log(`Selected ${finalProducts.length} trending products`);

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
        d => (d.type === 'Product' && d.product === product.productId.toString()) ||
             (d.type === 'Category' && d.product === product.category) ||
             (d.type === 'All' && d.applyToAllProducts)
      );

      // Calculate discounted price if discount exists
      let discountedPrice = null;
      if (discount) {
        discountedPrice = product.price - (product.price * discount.percentage / 100);
        discountedPrice = Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
      }

      return {
        id: product.productId,
        name: product.name,
        price: product.price,
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
        } : undefined,
        // Include sales data for debugging
        totalSold: product.totalSold
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
