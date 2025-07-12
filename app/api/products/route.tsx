import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import Discount from '@/models/Discount'; // Add this import
import cloudinary from "@/lib/cloudinary"; // Uncomment this for image uploads
import connectDB from '@/lib/optimizedDB'; // Use optimized connection

// Helper function to escape regex special characters
const escapeRegex = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (imageData: string) => {
  try {
    // Remove the data:image/xxx;base64, part if it exists
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, {
      folder: "pinnacle_products",
      resource_type: "image"
    });
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

// Add CORS headers helper with cache control
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Add cache headers for products
const cacheHeaders = {
  'Cache-Control': 'public, max-age=180, stale-while-revalidate=60', // 3 minutes cache, 1 minute stale
  'CDN-Cache-Control': 'public, max-age=300', // 5 minutes for CDN
  'Vary': 'Accept-Encoding',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Parse query parameters with proper URL decoding
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchQuery = searchParams.get('q');
    const category = searchParams.get('category') ? decodeURIComponent(searchParams.get('category')!) : null;
    const subCategory = searchParams.get('subCategory') ? decodeURIComponent(searchParams.get('subCategory')!) : null;
    const productId = searchParams.get('id'); // For fetching a single product

    // Create cache key for this request
    const cacheKey = `products:${JSON.stringify({ page, limit, searchQuery, category, subCategory, productId })}`;
    
    console.log(`API: Fetching products with filters:`, { category, subCategory, searchQuery, page, limit });

    // Get active discounts with caching
    const activeDiscounts = await Discount.find({
      status: 'Active',
      startDate: { $lte: new Date().toISOString().split('T')[0] },
      endDate: { $gte: new Date().toISOString().split('T')[0] }
    }).lean(); // Use lean() for better performance

    // If fetching a single product by ID
    if (productId) {
      console.log(`API: Fetching product with ID: ${productId}`);
      const product = await Product.findById(productId);
      
      if (!product) {
        console.error(`API: Product not found with ID: ${productId}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Product not found' 
        }, { status: 404 });
      }
      
      // Calculate discounted price if applicable
      let discountedPrice = null;
      
      // Check if product has an active discount
      const productSpecificDiscount = activeDiscounts.find(
        d => (d.type === 'Product' && d.product === product._id.toString()) ||
             (d.type === 'Category' && d.product === product.category) ||
             (d.type === 'Sub-category' && d.product === product.subCategory) ||
             (d.type === 'All' && d.applyToAllProducts)
      );
          
      // Calculate discounted price if discount exists
      if (productSpecificDiscount) {
        discountedPrice = product.regularPrice - (product.regularPrice * productSpecificDiscount.percentage / 100);
        discountedPrice = Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
        
        console.log(`Applied discount of ${productSpecificDiscount.percentage}% to product ${product.productName}`);
        console.log(`Original price: $${product.regularPrice}, Discounted price: $${discountedPrice}`);
      }
      
      // Include the discounted price in the response
      const productWithDiscount = product.toObject();
      if (discountedPrice !== null) {
        productWithDiscount.discountedPrice = discountedPrice;
      }
      
      return NextResponse.json({
        success: true,
        product: productWithDiscount
      }, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=120', // 5 minutes cache for single products
          'CDN-Cache-Control': 'public, max-age=600', // 10 minutes for CDN
          'Vary': 'Accept-Encoding',
        },
      });
    }

    // For fetching multiple products with pagination
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build the query object
    let query: any = {};

    // Add search functionality
    if (searchQuery) {
      query.$or = [
        { productName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tag: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Add category filter if provided - use exact case-insensitive matching
    if (category) {
      // Trim whitespace and use exact matching with case insensitivity
      const trimmedCategory = category.trim();
      query.category = { $regex: new RegExp(`^${escapeRegex(trimmedCategory)}$`, 'i') };
      console.log(`API: Filtering products by category: "${trimmedCategory}"`);
    }

    // Add subCategory filter if provided - use exact case-insensitive matching
    if (subCategory) {
      // Trim whitespace and use exact matching with case insensitivity
      const trimmedSubCategory = subCategory.trim();
      query.subCategory = { $regex: new RegExp(`^${escapeRegex(trimmedSubCategory)}$`, 'i') };
      console.log(`API: Filtering products by subCategory: "${trimmedSubCategory}"`);
    }

    console.log(`API: Final query:`, JSON.stringify(query, null, 2));

    // Optimize database queries with parallel execution
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select('productName description category subCategory regularPrice gallery createdAt') // Only select needed fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance
    ]);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Calculate discounted prices for all fetched products
    const productsWithDiscounts = products.map((product: any) => {
      const productObj = { ...product };
      
      // Find applicable discount
      const discount = activeDiscounts.find(
        d => (d.type === 'Product' && d.product === product._id.toString()) ||
             (d.type === 'Category' && d.product === product.category) ||
             (d.type === 'Sub-category' && d.product === product.subCategory) ||
             (d.type === 'All' && d.applyToAllProducts)
      );
      
      // Calculate discounted price if discount exists
      if (discount) {
        const discountedPrice = product.regularPrice - (product.regularPrice * discount.percentage / 100);
        productObj.discountedPrice = Math.round(discountedPrice * 100) / 100;
      }
      
      return productObj;
    });

    return NextResponse.json({
      success: true,
      products: productsWithDiscounts,
      pagination: {
        total: totalProducts,
        pages: totalPages,
        page,
        limit
      }
    }, {
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch products' 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    const body = await request.json();
    
    // Process gallery images - upload each to Cloudinary including additional images
    const processedGallery = await Promise.all(
      body.gallery.map(async (item: any) => {
        // Process main image
        let processedMainImage: string;
        if (typeof item.src === 'string' && (
            item.src.startsWith('data:image') || 
            item.src.match(/^[A-Za-z0-9+/=]+$/)
          )) {
          processedMainImage = await uploadToCloudinary(item.src);
        } else {
          processedMainImage = item.src;
        }
        
        // Process additional images if they exist
        const processedAdditionalImages = item.additionalImages && item.additionalImages.length > 0 
          ? await Promise.all(item.additionalImages.map(async (additionalImg: any) => {
              // Only process if it's a base64 string
              if (typeof additionalImg.src === 'string' && (
                  additionalImg.src.startsWith('data:image') || 
                  additionalImg.src.match(/^[A-Za-z0-9+/=]+$/)
                )) {
                // Upload to Cloudinary
                const imageUrl = await uploadToCloudinary(additionalImg.src);
                
                return {
                  src: imageUrl,
                  name: additionalImg.name || ''
                };
              }
              
              // If not a base64 string, just return the item unchanged
              return additionalImg;
            }))
          : [];
        
        // Return updated item with Cloudinary URLs
        return {
          src: processedMainImage,
          name: item.name || '',
          color: item.color || '',
          additionalImages: processedAdditionalImages
        };
      })
    );
    
    // Process size chart image if it exists
    let sizeChartImageUrl = null;
    if (body.sizeChartImage && typeof body.sizeChartImage === 'string' && 
        (body.sizeChartImage.startsWith('data:image') || 
         body.sizeChartImage.match(/^[A-Za-z0-9+/=]+$/))) {
      sizeChartImageUrl = await uploadToCloudinary(body.sizeChartImage);
      console.log("Size chart image uploaded:", sizeChartImageUrl);
    }
    
    // Save using Mongoose with processed gallery and size chart
    const newProduct = new Product({
      productName: body.productName,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory,
      regularPrice: Number(body.regularPrice),
      tag: body.tag,
      sizes: body.sizes,
      gallery: processedGallery,
      
      // Add new occasion-related fields
      occasions: body.occasions || [],
      style: body.style || [],
      season: body.season || [],
      
      // Add fitType and sizing info - these will be relevant for clothing but not accessories
      fitType: body.fitType,
      sizingTrend: body.sizingTrend,
      sizingNotes: body.sizingNotes,
      // Only add sizeChart if it's defined
      ...(body.sizeChart && Object.keys(body.sizeChart).length > 0 ? { sizeChart: body.sizeChart } : {}),
      
      // Add size chart image URL
      sizeChartImage: sizeChartImageUrl
    });
    
    await newProduct.save();
    
    // Create a new inventory entry for this product
    const newInventory = new Inventory({
      productId: newProduct._id,
      productName: newProduct.productName,
      stock: 0, // Initialize with zero stock
      status: 'Newly Added', // Set initial status
      image: processedGallery.length > 0 ? processedGallery[0].src : '',
      // Initialize size stock with zeros - only for non-accessories or if sizes are provided
      sizeStock: body.sizes && body.sizes.length > 0 ? 
        body.sizes.reduce((acc: any, size: string) => {
          acc[size] = 0;
          return acc;
        }, {}) : 
        { default: 0 } // Use a default stock counter for accessories
    });
    
    await newInventory.save();
    
    return NextResponse.json({ 
      message: "Product created and added to inventory", 
      product: newProduct,
      inventory: newInventory
    }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create product" 
    }, { status: 500 });
  }
}
