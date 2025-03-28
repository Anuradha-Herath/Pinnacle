import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import cloudinary from '@/lib/cloudinary';

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

// GET a single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Properly await the params object before accessing id
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch category" 
    }, { status: 500 });
  }
}

// UPDATE a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Properly await the params object before accessing id
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate mainCategory is an array with at least one value
    if (!body.mainCategory || !Array.isArray(body.mainCategory) || body.mainCategory.length === 0) {
      return NextResponse.json({ 
        error: "Please select at least one main category" 
      }, { status: 400 });
    }
    
    // Upload new thumbnail image if provided
    if (body.thumbnailImage && body.thumbnailImage.startsWith('data:')) {
      body.thumbnailImage = await uploadToCloudinary(body.thumbnailImage);
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        priceRange: body.priceRange,
        mainCategory: body.mainCategory, // Now handled as an array
        ...(body.thumbnailImage && { thumbnailImage: body.thumbnailImage })
      },
      { new: true }
    );
    
    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Category updated successfully",
      category: updatedCategory
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update category" 
    }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Properly await the params object before accessing id
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    // You could also delete the category image from Cloudinary here
    
    return NextResponse.json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete category" 
    }, { status: 500 });
  }
}
