import Order from "@/models/Order";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('reportType') || 'daily'; // daily, weekly, monthly, yearly
    
    // Ensure dates are provided
    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: "Start and end dates are required"
      }, { status: 400 });
    }
    
    // Build query object for date range
    const dateQuery = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };
    
    // Fetch orders within date range
    const orders = await Order.find(dateQuery).select(
      'orderNumber createdAt amount status paymentStatus line_items'
    );
    
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        salesData: [],
        topProducts: [],
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalItems: 0,
          filteredOrders: 0,
          revenueGrowth: 0
        }
      });
    }
    
    // Calculate total revenue and other metrics
    let totalRevenue = 0;
    let totalItems = 0;
    const productMap = new Map();
    
    // Process orders to extract metrics
    orders.forEach(order => {
      // Add to total revenue
      if (order.amount && typeof order.amount.total === 'number') {
        totalRevenue += order.amount.total;
      }
      
      // Count items and collect product data
      if (order.line_items && Array.isArray(order.line_items)) {
        order.line_items.forEach((item: any) => {
          // Make sure item has the necessary fields
          if (!item || typeof item.quantity !== 'number') {
            console.warn('Invalid line item detected:', item);
            return;
          }
          
          totalItems += item.quantity;
          
          // Make sure price_data exists and has necessary fields
          if (!item.price_data) {
            console.warn('Line item missing price_data:', item);
            return;
          }
          
          // Track product sales
          const productName = item.price_data.product_data || 'Unknown Product';
          const productData = productMap.get(productName) || { sales: 0, revenue: 0 };
          
          // Calculate item revenue carefully
          let itemRevenue = 0;
          try {
            const unitAmount = item.price_data.unit_amount || 0;
            itemRevenue = (unitAmount / 100) * item.quantity;
          } catch (err) {
            console.error('Error calculating item revenue:', err);
          }
          
          productMap.set(productName, {
            sales: productData.sales + item.quantity,
            revenue: productData.revenue + itemRevenue
          });
        });
      } else {
        console.warn('Order missing line_items array:', order._id);
      }
    });
    
    // Calculate average order value
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    // Get top products
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Format sales data based on report type
    const salesData = generateSalesData(orders, reportType);
    
    // Calculate revenue growth compared to previous period
    const prevStart = new Date(startDate);
    const prevEnd = new Date(endDate);
    const periodDuration = prevEnd.getTime() - prevStart.getTime();
    
    prevStart.setTime(prevStart.getTime() - periodDuration);
    prevEnd.setTime(prevEnd.getTime() - periodDuration);
    
    // Get previous period orders for comparison
    const prevPeriodQuery = {
      createdAt: {
        $gte: prevStart,
        $lte: prevEnd
      }
    };
    
    const prevPeriodOrders = await Order.find(prevPeriodQuery).select('amount');
    
    let prevPeriodRevenue = 0;
    prevPeriodOrders.forEach(order => {
      if (order.amount && typeof order.amount.total === 'number') {
        prevPeriodRevenue += order.amount.total;
      }
    });
    
    // Calculate growth percentage
    let revenueGrowth = 0;
    if (prevPeriodRevenue > 0) {
      revenueGrowth = ((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100;
    }
    
    // Count total orders in the system
    const totalOrdersCount = await Order.countDocuments();
    
    return NextResponse.json({
      success: true,
      salesData,
      topProducts,
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        averageOrderValue,
        totalItems,
        filteredOrders: orders.length,
        allOrders: totalOrdersCount,
        revenueGrowth
      }
    });
    
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate sales report"
    }, { status: 500 });
  }
}

// Helper function to generate sales data based on report type
function generateSalesData(orders: any[], reportType: string) {
  const salesMap = new Map();
  
  orders.forEach(order => {
    if (!order.createdAt || !order.amount?.total) return;
    
    let dateKey;
    const date = new Date(order.createdAt);
    
    // Format date key based on report type
    switch (reportType) {
      case 'weekly':
        // Get the week start date (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        dateKey = `${date.getFullYear()}`;
        break;
      case 'daily':
      default:
        dateKey = date.toISOString().split('T')[0];
        break;
    }
    
    const currentData = salesMap.get(dateKey) || { revenue: 0, orders: 0 };
    salesMap.set(dateKey, {
      revenue: currentData.revenue + order.amount.total,
      orders: currentData.orders + 1
    });
  });
  
  // Convert map to array and sort by date
  return Array.from(salesMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
