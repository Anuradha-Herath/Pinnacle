import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Review from '@/models/Review';
import Inventory from '@/models/Inventory';
import Discount from '@/models/Discount';

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

// GET - Fetch complete product details with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    
    // Fetch all data in parallel for better performance
    const [product, reviews, inventory, activeDiscounts, relatedProducts] = await Promise.all([
      // Main product
      Product.findById(id),
      
      // Product reviews
      Review.find({ productId: id }).sort({ createdAt: -1 }).limit(20),
      
      // Inventory status
      Inventory.findOne({ productId: id }),
      
      // Active discounts
      Discount.find({
        status: 'Active',
        startDate: { $lte: new Date().toISOString().split('T')[0] },
        endDate: { $gte: new Date().toISOString().split('T')[0] }
      }),
      
      // Related products (limit to 6 for performance)
      Product.find({ 
        category: { $exists: true },
        _id: { $ne: id } 
      }).limit(6)
    ]);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Calculate discounted price if applicable
    let discountedPrice = null;
    const productSpecificDiscount = activeDiscounts.find(
      d => (d.type === 'Product' && d.product === product._id.toString()) ||
           (d.type === 'Category' && d.product === product.category) ||
           (d.type === 'Sub-category' && d.product === product.subCategory) ||
           (d.type === 'All' && d.applyToAllProducts)
    );
    
    if (productSpecificDiscount) {
      discountedPrice = product.regularPrice - (product.regularPrice * productSpecificDiscount.percentage / 100);
      discountedPrice = Math.round(discountedPrice * 100) / 100;
    }
    
    // Filter related products by same category
    const filteredRelatedProducts = relatedProducts
      .filter(p => p.category === product.category)
      .slice(0, 6);
    
    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    // Prepare response with all data
    const productWithDiscount = product.toObject();
    if (discountedPrice !== null) {
      productWithDiscount.discountedPrice = discountedPrice;
    }
    
    return NextResponse.json({
      success: true,
      product: productWithDiscount,
      reviews: reviews,
      inventory: inventory || null,
      relatedProducts: filteredRelatedProducts,
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=120', // 5 minutes cache, 2 minutes stale
        'CDN-Cache-Control': 'public, max-age=600', // 10 minutes for CDN
        'Vary': 'Accept-Encoding',
      },
    });
    
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch product details" 
    }, { status: 500 });
  }
}
