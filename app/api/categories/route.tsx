import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import cloudinary from '@/lib/cloudinary';
import connectDB from '@/lib/optimizedDB'; // Use optimized connection
import { adminCategoryCache } from '@/lib/adminCategoryCache';
import { deduplicateRequest } from '@/lib/requestDeduplication';
import { PerformanceTimer, logApiCall, timeOperation } from '@/lib/serverPerformanceLogger';

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

// Add CORS headers helper with cache control
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Add cache headers for categories (relatively stable data)
const cacheHeaders = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutes cache, 1 minute stale
  'CDN-Cache-Control': 'public, max-age=600', // 10 minutes for CDN
  'Vary': 'Accept-Encoding',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET all categories with enhanced caching and deduplication
export async function GET(request: NextRequest) {
  const timer = new PerformanceTimer();
  const cacheKey = 'admin-categories-list';
  
  return deduplicateRequest(cacheKey, async () => {
    try {
      // Check cache first
      const cachedCategories = adminCategoryCache.get(cacheKey);
      if (cachedCategories) {
        const duration = timer.end();
        logApiCall('/api/categories', 'GET', duration, 'HIT');
        
        return NextResponse.json({ categories: cachedCategories }, {
          headers: {
            ...corsHeaders,
            ...cacheHeaders,
            'X-Cache': 'HIT',
            'X-Response-Time': `${duration.toFixed(2)}ms`,
          },
        });
      }

      // Database operation with timing
      const categories = await timeOperation('Database: Category.find()', async () => {
        await connectDB();
        return await Category.find()
          .sort({ createdAt: -1 })
          .lean() // Returns plain JavaScript objects instead of Mongoose documents
          .exec();
      }, { collection: 'categories', operation: 'find-all' });
      
      // Cache the results
      adminCategoryCache.set(cacheKey, categories, 5 * 60 * 1000); // 5 minutes
      
      const duration = timer.end();
      logApiCall('/api/categories', 'GET', duration, 'MISS');
      
      return NextResponse.json({ categories }, {
        headers: {
          ...corsHeaders,
          ...cacheHeaders,
          'X-Cache': 'MISS',
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    } catch (error) {
      const duration = timer.end();
      logApiCall('/api/categories', 'GET', duration, 'ERROR');
      
      console.error("Error fetching categories:", error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : "Failed to fetch categories" 
      }, { 
        status: 500,
        headers: {
          ...corsHeaders,
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    }
  });
}

// CREATE a new category with optimized image handling and cache invalidation
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer();
  
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields early
    if (!body.title || !body.description) {
      const duration = timer.end();
      logApiCall('/api/categories', 'POST', duration, 'ERROR');
      
      return NextResponse.json({ 
        error: "Title and description are required" 
      }, { 
        status: 400,
        headers: {
          ...corsHeaders,
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    }
    
    // Validate and process mainCategory
    let mainCategoryArray: string[];
    
    if (typeof body.mainCategory === 'string') {
      // If it's a single string, convert to array
      mainCategoryArray = [body.mainCategory];
    } else if (Array.isArray(body.mainCategory)) {
      // If it's already an array, use it
      mainCategoryArray = body.mainCategory;
    } else {
      const duration = timer.end();
      logApiCall('/api/categories', 'POST', duration, 'ERROR');
      
      return NextResponse.json({ 
        error: "mainCategory must be a string or an array of strings"
      }, { 
        status: 400,
        headers: {
          ...corsHeaders,
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    }
    
    if (mainCategoryArray.length === 0) {
      const duration = timer.end();
      logApiCall('/api/categories', 'POST', duration, 'ERROR');
      
      return NextResponse.json({ 
        error: "Please select at least one main category" 
      }, { 
        status: 400,
        headers: {
          ...corsHeaders,
          'X-Response-Time': `${duration.toFixed(2)}ms`,
        },
      });
    }

    // Upload thumbnail image if provided (with better error handling)
    let thumbnailUrl = '';
    if (body.thumbnailImage && body.thumbnailImage.startsWith('data:')) {
      try {
        thumbnailUrl = await timeOperation('Cloudinary Upload', async () => {
          return await uploadToCloudinary(body.thumbnailImage);
        }, { imageType: 'thumbnail' });
      } catch (uploadError) {
        const duration = timer.end();
        logApiCall('/api/categories', 'POST', duration, 'ERROR');
        
        console.error("Image upload failed:", uploadError);
        return NextResponse.json({ 
          error: "Failed to upload image. Please try again." 
        }, { 
          status: 400,
          headers: {
            ...corsHeaders,
            'X-Response-Time': `${duration.toFixed(2)}ms`,
          },
        });
      }
    }
    
    // Database operation with timing
    const newCategory = await timeOperation('Database: Category.create()', async () => {
      const category = new Category({
        title: body.title,
        description: body.description,
        priceRange: body.priceRange,
        mainCategory: mainCategoryArray, // Use the processed array
        thumbnailImage: thumbnailUrl
      });
      
      return await category.save();
    }, { collection: 'categories', operation: 'create' });
    
    // Invalidate cache after successful creation
    adminCategoryCache.invalidate('admin-categories');
    
    const duration = timer.end();
    logApiCall('/api/categories', 'POST', duration);
    
    return NextResponse.json({
      message: "Category created successfully",
      category: newCategory
    }, { 
      status: 201,
      headers: {
        ...corsHeaders,
        'X-Response-Time': `${duration.toFixed(2)}ms`,
      },
    });
  } catch (error) {
    const duration = timer.end();
    logApiCall('/api/categories', 'POST', duration, 'ERROR');
    
    console.error("Error creating category:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create category" 
    }, { 
      status: 500,
      headers: {
        ...corsHeaders,
        'X-Response-Time': `${duration.toFixed(2)}ms`,
      },
    });
  }
}

// UPDATE an existing category
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        error: "Category ID is required" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid category ID format" 
      }, { status: 400 });
    }
    
    // Validate and process mainCategory if provided
    if (updateData.mainCategory) {
      let mainCategoryArray: string[];
      
      if (typeof updateData.mainCategory === 'string') {
        mainCategoryArray = [updateData.mainCategory];
      } else if (Array.isArray(updateData.mainCategory)) {
        mainCategoryArray = updateData.mainCategory;
      } else {
        return NextResponse.json({ 
          error: "mainCategory must be a string or an array of strings"
        }, { status: 400 });
      }
      
      if (mainCategoryArray.length === 0) {
        return NextResponse.json({ 
          error: "Please select at least one main category" 
        }, { status: 400 });
      }
      
      updateData.mainCategory = mainCategoryArray;
    }

    // Handle image upload if new image provided
    if (updateData.thumbnailImage && updateData.thumbnailImage.startsWith('data:')) {
      try {
        updateData.thumbnailImage = await uploadToCloudinary(updateData.thumbnailImage);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return NextResponse.json({ 
          error: "Failed to upload image. Please try again." 
        }, { status: 400 });
      }
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedCategory) {
      return NextResponse.json({ 
        error: "Category not found" 
      }, { status: 404 });
    }
    
    // Invalidate cache after successful update
    adminCategoryCache.invalidate('admin-categories');
    
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

// DELETE a category
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: "Category ID is required" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: "Invalid category ID format" 
      }, { status: 400 });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id).lean();
    
    if (!deletedCategory) {
      return NextResponse.json({ 
        error: "Category not found" 
      }, { status: 404 });
    }
    
    // Invalidate cache after successful deletion
    adminCategoryCache.invalidate('admin-categories');
    
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
