import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Product from "@/models/Product";

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

// GET method to fetch wishlist products by IDs
export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectDB();
    
    // Get URL parameters
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json({ products: [] });
    }
    
    const productIds = ids.split(',').filter(id => id.trim() && mongoose.Types.ObjectId.isValid(id.trim()));
    
    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }
    
    // Convert string IDs to ObjectId
    const validProductIds = productIds.map(id => new mongoose.Types.ObjectId(id.trim()));
    
    // Get products from the database
    const products = await Product.find({
      _id: { $in: validProductIds }
    });
    
    // Transform products to customer format
    const customerProducts = products.map(product => ({
      id: product._id,
      name: product.productName,
      price: product.regularPrice,
      image: product.gallery && product.gallery.length > 0 ? 
        product.gallery[0].src : '/placeholder.png',
      colors: product.gallery?.map((item: any) => item.src) || [],
      sizes: product.sizes || [],
    }));
    
    return NextResponse.json({ products: customerProducts });
  } catch (error) {
    console.error("Error fetching wishlist products:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch wishlist products" 
    }, { status: 500 });
  }
}
