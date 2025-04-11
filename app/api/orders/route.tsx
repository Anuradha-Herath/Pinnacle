import Order from "@/models/Order";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request: Request) {
    try {
        console.log("Checking MongoDB connection");
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(
            process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
            );
            console.log("Connected to MongoDB");
            }
        const orders = await Order.find().sort({ createdAt: -1 });
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}