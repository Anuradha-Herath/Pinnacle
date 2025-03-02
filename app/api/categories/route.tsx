import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import cloudinary from '@/lib/cloudinary';

// Connect to MongoDB using Mongoose
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB via Mongoose');
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
      folder: "pinnacle_categories",
      resource_type: "image"
    });
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

// GET all categories
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch categories" 
    }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Upload thumbnail image if provided
    let thumbnailImage = '';
    if (body.thumbnailImage) {
      thumbnailImage = await uploadToCloudinary(body.thumbnailImage);
    }
    
    // Create category with image URL from Cloudinary and mainCategory
    const newCategory = new Category({
      title: body.title,
      description: body.description || '',
      priceRange: body.priceRange || '',
      thumbnailImage,
      mainCategory: body.mainCategory,
    });
    
    await newCategory.save();
    
    return NextResponse.json({ 
      message: "Category created successfully", 
      category: newCategory 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    
    // Specifically check for MongoDB duplicate key error
    if (error instanceof Error && error.message.includes('E11000 duplicate key error')) {
      return NextResponse.json({ 
        error: `A category with this title already exists. Please use a different title.` 
      }, { status: 409 }); // Use 409 Conflict for duplicate resources
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create category" 
    }, { status: 500 });
  }
}
