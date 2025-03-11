import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";

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
      folder: "pinnacle_products",
      resource_type: "image"
    });
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

// GET a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Extract id directly from the destructured params
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch product" 
    }, { status: 500 });
  }
}

// UPDATE a product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Extract id directly from the destructured params
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Process any new images in gallery
    const processedGallery = await Promise.all(
      body.gallery.map(async (item: any) => {
        // Only process if it's a base64 string
        if (typeof item.src === 'string' && (
            item.src.startsWith('data:image') || 
            item.src.match(/^[A-Za-z0-9+/=]+$/)
          )) {
          // Upload to Cloudinary
          const imageUrl = await uploadToCloudinary(item.src);
          
          // Return updated item with Cloudinary URL and ensure color is preserved
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
    
    // Update product with processed gallery
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      {
        productName: body.productName,
        description: body.description,
        category: body.category,
        subCategory: body.subCategory,
        regularPrice: Number(body.regularPrice),
        tag: body.tag,
        sizes: body.sizes,
        gallery: processedGallery
      }, 
      { new: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update product" 
    }, { status: 500 });
  }
}

// DELETE a product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Extract id directly from the destructured params
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Here you could also delete product images from Cloudinary 
    // if you want to free up storage space
    
    return NextResponse.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete product" 
    }, { status: 500 });
  }
}
