"use server";

import connectDB from "../../../lib/db";
import Order from "../../../models/Order";
import User from "@/models/User";
import mongoose from "mongoose";

export interface BestSellingProduct {
  productId: string;
  name: string;
  price: number;
  salesCount: number;
  imageUrl?: string;
}

export interface RecentOrder {
  orderId: string;
  createdAt: string;
  customer: string;
  items: number;
  deliveryNumber: string;
  orderStatus: string;
  totalAmount: number;
}

export interface DashboardData {
  totalOrders: number;
  totalOrdersValue: number;
  activeOrders: number;
  activeOrdersValue: number;
  processingOrders: number; // Orders with status "Processing"
  shippedOrders: number;    // Orders with status "Shipped"
  paidOrders: number;       // Orders with status "Paid"
  completedOrders: number;
  completedOrdersValue: number;
  totalActiveData: number;  // Sum of active orders and completed orders
  deliveredOrders: number;  // Orders with status "Delivered"
  refundedOrders: number;   // Orders with status "Refunded"
  totalCustomers: number;
  salesByMonth: { month: string; sales: number; orderCount: number }[];
  bestSellingProducts: BestSellingProduct[];
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    await connectDB();

    // Get orders data with specific conditions:
    // - Total orders: All orders with paymentStatus = "paid"
    // - Active orders: Orders with paymentStatus = "paid" and status in ["Processing", "Shipped", "Paid"]
    // - Completed orders: Orders with paymentStatus = "paid" and status in ["Delivered", "Refunded"]
    // - Delivered orders: Orders with paymentStatus = "paid" and status = "Delivered"
    // - Refunded orders: Orders with paymentStatus = "paid" and status = "Refunded"
    // - Processing orders: Orders with paymentStatus = "paid" and status = "Processing"
    // - Shipped orders: Orders with paymentStatus = "paid" and status = "Shipped"
    // - Paid orders: Orders with paymentStatus = "paid" and status = "Paid"
    const [
      totalOrders, 
      activeOrders, 
      completedOrders, 
      deliveredOrders, 
      refundedOrders,
      processingOrders,
      shippedOrders,
      paidOrders,
      totalCustomers, 
      monthlySales
    ] = await Promise.all([
      // Total orders - only paid orders
      Order.countDocuments({
        paymentStatus: "paid"
      }),
      
      // Active orders (Processing and Shipped) - only paid orders
      Order.countDocuments({
        status: { $in: ["Processing", "Shipped", "Paid"] },
        paymentStatus: "paid"
      }),
      
      // Completed orders (Delivered or Refunded) - only paid orders
      Order.countDocuments({
        status: { $in: ["Delivered", "Refunded"] },
        paymentStatus: "paid"
      }),
      
      // Delivered orders - only paid orders with status = "Delivered"
      Order.countDocuments({
        status: "Delivered",
        paymentStatus: "paid"
      }),
      
      // Refunded orders - only paid orders with status = "Refunded"
      Order.countDocuments({
        status: "Refunded",
        paymentStatus: "paid"
      }),
      
      // Processing orders - only paid orders with status = "Processing"
      Order.countDocuments({
        status: "Processing",
        paymentStatus: "paid"
      }),
      
      // Shipped orders - only paid orders with status = "Shipped"
      Order.countDocuments({
        status: "Shipped",
        paymentStatus: "paid"
      }),
      
      // Paid orders - only paid orders with status = "Paid"
      Order.countDocuments({
        status: "Paid",
        paymentStatus: "paid"
      }),
      
      // Total unique customers
      User.countDocuments({ role: "user" }),
      
      // Get sales by month for the current year
      getSalesByMonth()
    ]);

    // Get order values
    const [totalOrdersValue, activeOrdersValue, completedOrdersValue, bestSellingProducts] = await Promise.all([
      // Total orders value - only paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount.total" } } }
      ]),
      
      // Active orders value - only paid orders
      Order.aggregate([
        { 
          $match: { 
            status: { $in: ["Processing", "Shipped", "Paid"] },
            paymentStatus: "paid"
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount.total" } } }
      ]),
      
      // Completed orders value - only paid orders with status Delivered or Refunded
      Order.aggregate([
        { 
          $match: { 
            status: { $in: ["Delivered", "Refunded"] },
            paymentStatus: "paid"
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount.total" } } }
      ]),
      
      // Get best selling products
      getBestSellingProducts()
    ]);

    return {
      totalOrders,
      totalOrdersValue: totalOrdersValue[0]?.total || 0,
      activeOrders,
      activeOrdersValue: activeOrdersValue[0]?.total || 0,
      processingOrders,
      shippedOrders,
      paidOrders,
      completedOrders,
      completedOrdersValue: completedOrdersValue[0]?.total || 0,
      totalActiveData: activeOrders + completedOrders, // Sum of active and completed orders
      deliveredOrders,
      refundedOrders,
      totalCustomers,
      salesByMonth: monthlySales,
      bestSellingProducts
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
}

async function getSalesByMonth() {
  const currentYear = new Date().getFullYear();
  
  // Create the start and end dates for the year
  const startDate = new Date(currentYear, 0, 1); // January 1st of current year
  const endDate = new Date(currentYear, 11, 31); // December 31st of current year
  
  const salesByMonth = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "paid" // Only include paid orders
      }
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        sales: { $sum: "$amount.total" },
        orderCount: { $sum: 1 } // Count orders per month
      }
    },
    {
      $sort: { "_id.month": 1 }
    }
  ]);
  
  // Format the result to include all months (even with zero sales)
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const formattedSales = monthNames.map((month, index) => {
    const monthData = salesByMonth.find(item => item._id.month === index + 1);
    return {
      month,
      sales: monthData ? monthData.sales : 0,
      orderCount: monthData ? monthData.orderCount : 0
    };
  });
  
  return formattedSales;
}

async function getBestSellingProducts(): Promise<BestSellingProduct[]> {
  try {
    // Unwind the line_items array to treat each product separately
    // Only include paid orders
    const productSales = await Order.aggregate([
      { $match: { 
          paymentStatus: "paid"
        } 
      },
      { $unwind: "$line_items" },
      {
        $group: {
          _id: "$line_items.metadata.productId",
          salesCount: { $sum: "$line_items.quantity" },
          // Try to extract name from different possible locations
          productData: { $first: "$line_items.price_data.product_data" },
          price: { $first: "$line_items.price_data.unit_amount" },
          imageUrl: { $first: "$line_items.metadata.imageUrl" }
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: 5 }
    ]);
    
    console.log("Debug - Raw product sales data:", JSON.stringify(productSales, null, 2));
    
    // Format the results with better name extraction
    return productSales.map(item => {
      // Try to extract name from product_data which might be a string or an object
      let productName = "Product Name Unavailable";
      
      if (item.productData) {
        if (typeof item.productData === 'string') {
          try {
            // If it's a JSON string, try to parse it
            const parsed = JSON.parse(item.productData);
            productName = parsed.name || `Product ${item._id}`;
          } catch (e) {
            // If it's not valid JSON but has content, use it as the name
            productName = item.productData;
          }
        } else if (typeof item.productData === 'object') {
          // If it's already an object, try to get the name property
          productName = item.productData.name || `Product ${item._id}`;
        }
      }
      
      return {
        productId: item._id || "unknown",
        name: productName,
        price: (item.price || 0) / 100, // Convert from cents to dollars
        salesCount: item.salesCount || 0,
        imageUrl: item.imageUrl
      };
    });
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    return [];
  }
}

export async function getRecentOrders(limit: number = 7): Promise<RecentOrder[]> {
  try {
    await connectDB();
    
    // Fetch the most recent orders with paymentStatus = "paid"
    const recentOrders = await Order.find({ 
      paymentStatus: "paid" 
    })
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .limit(limit)
    .lean(); // Convert to plain JavaScript objects
    
    // Format the orders for display
    return recentOrders.map(order => {
      // Calculate total items
      const totalItems = order.line_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
      
      // Format customer name
      const customerName = order.customer 
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
        : 'Unknown Customer';
        
      // Format date
      const createdAtDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'Unknown Date';
        
      return {
        orderId: `#${(order._id as any).toString().slice(-6)}`,
        createdAt: createdAtDate,
        customer: customerName,
        items: totalItems,
        deliveryNumber: `#${Math.floor(Math.random() * 90000) + 10000}`, // Generate a random delivery number if not available
        orderStatus: order.status || 'Processing',
        totalAmount: order.amount?.total || 0
      };
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }
}
