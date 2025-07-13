import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/optimizedDB';
import { adminCategoryCache } from '@/lib/adminCategoryCache';
import { deduplicateRequest } from '@/lib/requestDeduplication';
import { PerformanceTimer, logApiCall, timeOperation } from '@/lib/serverPerformanceLogger';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Cache headers for individual categories
const cacheHeaders = {
  'Cache-Control': 'public, max-age=600, stale-while-revalidate=120', // 10 minutes cache, 2 minutes stale
  'CDN-Cache-Control': 'public, max-age=1200', // 20 minutes for CDN
  'Vary': 'Accept-Encoding',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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

// GET a single category by ID with caching and deduplication
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Properly await the params object before accessing id
  const { id } = await params;
  const cacheKey = `admin-category-${id}`;
  
  // Validate ObjectId format early
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ 
      error: "Invalid category ID format" 
    }, { 
      status: 400,
      headers: corsHeaders,
    });
  }

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Check cache first
      const cachedCategory = adminCategoryCache.get(cacheKey);
      if (cachedCategory) {
        return NextResponse.json({ category: cachedCategory }, {
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            'X-Cache': 'HIT',
          },
        });
      }

      await connectDB();
      
      const category = await Category.findById(id).lean().exec();
      
      if (!category) {
        return NextResponse.json({ 
          error: "Category not found" 
        }, { 
          status: 404,
          headers: corsHeaders,
        });
      }
      
      // Cache the result
      adminCategoryCache.set(cacheKey, category, 10 * 60 * 1000); // 10 minutes
      
      return NextResponse.json({ category }, {
        headers: {
          ...corsHeaders,
          ...cacheHeaders,
          'X-Cache': 'MISS',
        },
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : "Failed to fetch category" 
      }, { 
        status: 500,
        headers: corsHeaders,
      });
    }
  });
}

// UPDATE a category with enhanced error handling and cache invalidation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Properly await the params object before accessing id
    const { id } = await params;
    
    // Validate ObjectId format early
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid category ID format" 
      }, { 
        status: 400,
        headers: corsHeaders,
      });
    }

    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({ 
        error: "Title and description are required" 
      }, { 
        status: 400,
        headers: corsHeaders,
      });
    }
    
    // Validate and process mainCategory if provided
    if (body.mainCategory) {
      let mainCategoryArray: string[];
      
      if (typeof body.mainCategory === 'string') {
        mainCategoryArray = [body.mainCategory];
      } else if (Array.isArray(body.mainCategory)) {
        mainCategoryArray = body.mainCategory;
      } else {
        return NextResponse.json({ 
          error: "mainCategory must be a string or an array of strings"
        }, { 
          status: 400,
          headers: corsHeaders,
        });
      }
      
      if (mainCategoryArray.length === 0) {
        return NextResponse.json({ 
          error: "Please select at least one main category" 
        }, { 
          status: 400,
          headers: corsHeaders,
        });
      }
      
      body.mainCategory = mainCategoryArray;
    }
    
    // Handle image upload with better error handling
    if (body.thumbnailImage && body.thumbnailImage.startsWith('data:')) {
      try {
        body.thumbnailImage = await uploadToCloudinary(body.thumbnailImage);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return NextResponse.json({ 
          error: "Failed to upload image. Please try again." 
        }, { 
          status: 400,
          headers: corsHeaders,
        });
      }
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedCategory) {
      return NextResponse.json({ 
        error: "Category not found" 
      }, { 
        status: 404,
        headers: corsHeaders,
      });
    }
    
    // Invalidate related caches
    adminCategoryCache.invalidate('admin-category');
    
    return NextResponse.json({
      message: "Category updated successfully",
      category: updatedCategory
    }, { 
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update category" 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}

// DELETE a category with optimized cache invalidation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Properly await the params object before accessing id
    const { id } = await params;
    
    // Validate ObjectId format early
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid category ID format" 
      }, { 
        status: 400,
        headers: corsHeaders,
      });
    }

    await connectDB();
    
    const deletedCategory = await Category.findByIdAndDelete(id).lean();
    
    if (!deletedCategory) {
      return NextResponse.json({ 
        error: "Category not found" 
      }, { 
        status: 404,
        headers: corsHeaders,
      });
    }
    
    // Invalidate related caches
    adminCategoryCache.invalidate('admin-category');
    
    // Optional: Delete the category image from Cloudinary
    // if (deletedCategory.thumbnailImage) {
    //   try {
    //     const publicId = deletedCategory.thumbnailImage.split('/').pop()?.split('.')[0];
    //     if (publicId) {
    //       await cloudinary.uploader.destroy(`pinnacle_categories/${publicId}`);
    //     }
    //   } catch (cloudinaryError) {
    //     console.error("Failed to delete image from Cloudinary:", cloudinaryError);
    //   }
    // }
    
    return NextResponse.json({
      message: "Category deleted successfully",
      category: deletedCategory
    }, { 
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete category" 
    }, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}
