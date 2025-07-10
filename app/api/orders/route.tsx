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

        // Get URL parameters
        const url = new URL(request.url);
        const countOnly = url.searchParams.get('count') === 'true';
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        // Build query based on date parameters if provided
        let query: any = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // If only count is requested, return count only
        if (countOnly) {
            const totalCount = await Order.countDocuments(query);
            
            // Also get counts by status
            const statusCounts = await Order.aggregate([
                { $match: query },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);
            
            const statusMap = statusCounts.reduce((acc: any, item) => {
                acc[item._id || 'Unknown'] = item.count;
                return acc;
            }, {});
            
            return NextResponse.json({ 
                totalCount, 
                statusCounts: statusMap
            }, { status: 200 });
        }
        
        // Otherwise, get orders with optional limit
        let ordersQuery = Order.find(query).sort({ createdAt: -1 });
        
        if (limit) {
            ordersQuery = ordersQuery.limit(limit);
        }
        
        const orders = await ordersQuery.exec();
        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}