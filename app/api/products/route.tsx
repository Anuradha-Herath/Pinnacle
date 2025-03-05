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
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build filter based on query params
    const filter: Record<string, any> = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    
    // Count total products matching the filter
    const total = await Product.countDocuments(filter);
    
    // Get products with pagination
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({ 
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch products" 
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
          
          // Return updated item with Cloudinary URL
          return {
            ...item,
            src: imageUrl
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
      gallery: processedGallery
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
