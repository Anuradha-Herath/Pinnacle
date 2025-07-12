import Order from "@/models/Order";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

// This is a backup endpoint that directly accesses MongoDB
// to ensure we can get order data for the sales report
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log("Direct orders API called with dates:", startDate, endDate);
    
    // Create a simple query
    const query: any = {};
    
    // Add date filter if both dates are provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    
    // Get all orders from MongoDB directly
    const orders = await Order.find(query)
      .select('orderNumber createdAt amount status paymentStatus line_items customer')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`Direct API found ${orders.length} orders`);
    
    // Log the first order structure to debug
    if (orders.length > 0) {
      console.log("First order structure:", JSON.stringify(orders[0], null, 2));
    }
    
    // Convert MongoDB ObjectIds to strings for JSON
    const serializedOrders = orders.map(order => {
      const serialized = { ...order };
      if (serialized._id) {
        serialized._id = serialized._id.toString();
      }
      
      // Ensure line_items is properly structured
      if (serialized.line_items && Array.isArray(serialized.line_items)) {
        serialized.line_items = serialized.line_items.map(item => {
          // Check if item has the necessary structure
          if (!item.price_data || typeof item.price_data !== 'object') {
            // Try to reconstruct from available data
            return {
              quantity: item.quantity || 1,
              price_data: {
                unit_amount: (item.price || 0) * 100,
                product_data: item.name || "Unknown Product"
              },
              metadata: {
                productId: item.productId || item._id?.toString() || "unknown"
              }
            };
          }
          return item;
        });
      }
      
      return serialized;
    });
    
    return NextResponse.json(serializedOrders);
    
  } catch (error) {
    console.error("Error in direct orders API:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders directly" },
      { status: 500 }
    );
  }
}
