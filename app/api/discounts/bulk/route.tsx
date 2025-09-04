import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Discount from '@/models/Discount';
import connectDB from '@/lib/optimizedDB'; // Use optimized connection

// GET discounts for multiple products in one request
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ 
        message: "Invalid or empty product IDs array", 
        discounts: {} 
      }, { status: 400 });
    }

    // Find active discounts for all provided product IDs
    const today = new Date().toISOString().split('T')[0];
    
    const discounts = await Discount.find({
      product: { $in: productIds },
      type: 'Product',
      status: 'Active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).sort({ percentage: -1 });

    // Create a map of productId to discount
    const discountMap: Record<string, any> = {};
    
    // Group discounts by product and get the highest percentage for each
    const productDiscountMap = new Map();
    
    discounts.forEach(discount => {
      const productId = discount.product;
      const existing = productDiscountMap.get(productId);
      
      if (!existing || discount.percentage > existing.percentage) {
        productDiscountMap.set(productId, discount);
      }
    });

    // Convert to the expected response format
    productDiscountMap.forEach((discount, productId) => {
      discountMap[productId] = {
        id: discount._id,
        percentage: discount.percentage,
        active: true,
        productId: discount.product,
        type: discount.type,
        startDate: discount.startDate,
        endDate: discount.endDate
      };
    });
    
    return NextResponse.json({ 
      discounts: discountMap,
      count: Object.keys(discountMap).length
    });
    
  } catch (error) {
    console.error("Error fetching bulk discounts:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to fetch discount information",
      discounts: {}
    }, { status: 500 });
  }
}
