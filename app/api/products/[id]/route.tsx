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
    
    // Properly await the params object before accessing id
    const { id } = await params;
    
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Process gallery images including handling additionalImages properly
    const processedGallery = await Promise.all(
      body.gallery.map(async (item: any) => {
        // Process main image
        let mainImageUrl = item.src;
        
        // Only upload if it's a base64 string
        if (typeof item.src === 'string' && (
            item.src.startsWith('data:image') || 
            item.src.match(/^[A-Za-z0-9+/=]+$/)
          )) {
          mainImageUrl = await uploadToCloudinary(item.src);
        }
        
        // Process additional images if they exist
        const processedAdditionalImages = item.additionalImages && item.additionalImages.length > 0 
          ? await Promise.all(item.additionalImages.map(async (additionalImg: any) => {
              let additionalImageUrl = additionalImg.src;
              
              // Only upload if it's a base64 string
              if (typeof additionalImg.src === 'string' && (
                  additionalImg.src.startsWith('data:image') || 
                  additionalImg.src.match(/^[A-Za-z0-9+/=]+$/)
                )) {
                additionalImageUrl = await uploadToCloudinary(additionalImg.src);
              }
              
              return {
                id: additionalImg.id || `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                src: additionalImageUrl,
                name: additionalImg.name || ''
              };
            }))
          : [];
        
        // Return updated item with processed images
        return {
          src: mainImageUrl,
          name: item.name || '',
          color: item.color || '',  
          additionalImages: processedAdditionalImages
        };
      })
    );
    
    // Process size chart image if it exists
    let sizeChartImageUrl = body.sizeChartImage;
    if (body.sizeChartImage && typeof body.sizeChartImage === 'string' && 
        (body.sizeChartImage.startsWith('data:image') || 
         body.sizeChartImage.match(/^[A-Za-z0-9+/=]+$/))) {
      sizeChartImageUrl = await uploadToCloudinary(body.sizeChartImage);
      console.log("Size chart image uploaded:", sizeChartImageUrl);
    }
    
    // Create an update object that handles accessories appropriately
    const updateData = {
      productName: body.productName,
      description: body.description,
      category: body.category,
      subCategory: body.subCategory,
      regularPrice: Number(body.regularPrice),
      tag: body.tag,
      // For accessories, we may have an empty sizes array
      sizes: body.sizes || [],
      gallery: processedGallery,
      
      // Add occasion-related fields if they're provided
      ...(body.occasions ? { occasions: body.occasions } : {}),
      ...(body.style ? { style: body.style } : {}),
      ...(body.season ? { season: body.season } : {}),
      
      // Include size chart image URL if it exists
      ...(sizeChartImageUrl ? { sizeChartImage: sizeChartImageUrl } : {}),
      
      // Only include fit/sizing fields if not an accessory
      ...(body.category !== "Accessories" ? {
        fitType: body.fitType,
        sizingTrend: body.sizingTrend,
        sizingNotes: body.sizingNotes,
        ...(body.sizeChart && Object.keys(body.sizeChart).length > 0 ? { sizeChart: body.sizeChart } : {})
      } : {})
    };
    
    // Update product with processed gallery
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updateData, 
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
    
    // Properly await the params object before accessing id
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // CASCADE DELETE: Delete corresponding inventory item
    try {
      console.log(`Attempting to delete inventory record for product ${id}`);
      
      // Important: Check if inventory model is available, if not, use direct DB connection
      const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', new mongoose.Schema({}));
      
      // First try to find the inventory item to verify it exists
      const inventoryItem = await Inventory.findOne({ productId: id });
      console.log("Found inventory item:", inventoryItem ? "Yes" : "No");
      
      if (inventoryItem) {
        // Delete the inventory item using the proper model
        const deleteResult = await Inventory.deleteOne({ productId: id });
        console.log("Delete result:", deleteResult);
        
        if (deleteResult.deletedCount > 0) {
          console.log(`Successfully deleted inventory item with ID ${inventoryItem._id}`);
        } else {
          console.log(`Failed to delete inventory item despite finding it`);
        }
      } else {
        // Try with string comparison in case ID formats don't match
        const db = mongoose.connection.db;
        console.log("Trying direct collection access with string comparison");
        
        // Query inventory collection directly
        if (!db) {
          console.error("Database connection is undefined.");
        } else {
          const items = await db.collection('inventories').find({}).toArray();
          console.log(`Found ${items.length} inventory items total`);
          
          // Look for matching product ID (string comparison)
          const matchingItem = items.find(item => item.productId && item.productId.toString() === id.toString());
          
          if (matchingItem) {
            console.log(`Found inventory item ${matchingItem._id} by string comparison`);
            const deleteResult = await db.collection('inventories').deleteOne({ _id: matchingItem._id });
            console.log("Delete result:", deleteResult);
          } else {
            console.log("No matching inventory item found by any method");
          }
        }
      }
    } catch (inventoryError) {
      console.error("Error deleting from inventory:", inventoryError);
    }
    
    return NextResponse.json({
      message: "Product and related inventory deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete product" 
    }, { status: 500 });
  }
}
