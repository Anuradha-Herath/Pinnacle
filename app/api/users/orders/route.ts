import Order from "@/models/Order";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    console.log("Checking MongoDB connection for customer orders");
    // Ensure MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
      );
      console.log("Connected to MongoDB");
    }
    
    // Get URL to extract query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    
    // We need a userId to fetch orders
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No user ID provided" },
        { status: 400 }
      );
    }
    
    // Fetch orders for this specific user
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch customer orders" 
    }, { status: 500 });
  }
}