import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Review from '@/models/Review';
import Product from '@/models/Product';
import cloudinary from "@/lib/cloudinary";

// Connect to MongoDB
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
      folder: "pinnacle_reviews",
      resource_type: "image"
    });
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { productId, userName, rating, review, photoBase64 } = body;
    
    // Validate required fields
    if (!productId || !rating || !review) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }
    
    // Validate product exists
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid product ID" 
      }, { status: 400 });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ 
        success: false, 
        error: "Product not found" 
      }, { status: 404 });
    }
    
    // Process photo if provided
    let photoUrl = null;
    if (photoBase64) {
      photoUrl = await uploadToCloudinary(photoBase64);
    }
    
    // Create and save the review
    const newReview = new Review({
      productId,
      userName: userName || "Anonymous",
      rating,
      review,
      photoUrl,
      verified: false // By default, reviews aren't verified
    });
    
    await newReview.save();
    
    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      review: newReview
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to submit review" 
    }, { status: 500 });
  }
}

// GET - Fetch reviews for a product
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid or missing product ID" 
      }, { status: 400 });
    }
    
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch reviews" 
    }, { status: 500 });
  }
}
