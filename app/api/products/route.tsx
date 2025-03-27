import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import cloudinary from "@/lib/cloudinary"; // Uncomment this for image uploads

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const searchQuery = searchParams.get('q');
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');

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

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Add subCategory filter if provided
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Count total products matching the query for pagination
    const totalProducts = await Product.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalProducts,
        pages: totalPages,
        page,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch products' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    const body = await request.json();
    
    // Process gallery images - upload each to Cloudinary
    const processedGallery = await Promise.all(
      body.gallery.map(async (item: any) => {
        // Only process if it's a base64 string
        if (typeof item.src === 'string' && (
            item.src.startsWith('data:image') || 
            item.src.match(/^[A-Za-z0-9+/=]+$/)
          )) {
          // Upload to Cloudinary
          const imageUrl = await uploadToCloudinary(item.src);
          
          // Return updated item with Cloudinary URL and preserve the color information
          return {
            src: imageUrl,
            name: item.name || '',
            color: item.color || ''  // Ensure color is included
          };
        }
        
        // If not a base64 string, just return the item unchanged
        return item;
      })
    );
    
    // Save using Mongoose with processed gallery
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
    });
    
    await newProduct.save();
    
    // Create a new inventory entry for this product
    const newInventory = new Inventory({
      productId: newProduct._id,
      productName: newProduct.productName,
      stock: 0, // Initialize with zero stock
      status: 'Newly Added', // Set initial status
      image: processedGallery.length > 0 ? processedGallery[0].src : '',
      // Initialize size stock with zeros
      sizeStock: body.sizes.reduce((acc: any, size: string) => {
        acc[size] = 0;
        return acc;
      }, {})
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
