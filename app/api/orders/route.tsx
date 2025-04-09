import Order from "@/models/Order";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Connect to MongoDB with connection caching
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
      );
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

export async function GET(request: Request) {
    try {
        await connectDB();
        
        // Only select the fields we need to improve query performance
        const orders = await Order.find({}, {
            orderNumber: 1,
            createdAt: 1,
            'customer.firstName': 1,
            'amount.total': 1,
            status: 1,
        })
        .sort({ createdAt: -1 })
        .lean(); // Using lean() to get plain JavaScript objects instead of Mongoose documents
        
        return new NextResponse(JSON.stringify(orders), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ 
            error: "Failed to fetch orders",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}