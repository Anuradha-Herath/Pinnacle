"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import TopBar from "@/app/components/TopBar";
import { 
  ChartBarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  ChartPieIcon, 
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from "@heroicons/react/24/solid";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";

// Import chart components
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    color?: string;
    size?: string;
  }>;
  amount: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  status: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
}

const SalesReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<{start: Date, end: Date}>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [statsCards, setStatsCards] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalItems: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
  });
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Fetch order data with error handling
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // Get date range params for API
        const start = dateRange.start.toISOString();
        const end = dateRange.end.toISOString();
        
        // First fetch order counts to get accurate total orders
        const orderCountResponse = await fetch(`/api/orders?count=true&startDate=${start}&endDate=${end}`);
        const orderCountData = await orderCountResponse.json();
        
        // Fetch sales report data with specific date range and report type
        const response = await fetch(
          `/api/reports/sales?startDate=${start}&endDate=${end}&reportType=${reportType}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Sales report data:", data);
        
        if (!data.success) {
          throw new Error(data.error || 'API returned unsuccessful response');
        }
        
        // Update state with API data
        setSalesData(data.salesData || []);
        setTopProducts(data.topProducts || []);
        
        // Update stats with order count from orders API
        if (data.stats) {
          setStatsCards({
            totalRevenue: data.stats.totalRevenue || 0,
            // Use filtered order count based on the date range
            totalOrders: data.stats.filteredOrders || orderCountData.filteredCount || 0,
            totalItems: data.stats.totalItems || 0,
            averageOrderValue: data.stats.averageOrderValue || 0,
            revenueGrowth: data.stats.revenueGrowth || 0
          });
        }
        
        // Fetch orders for table display
        const ordersResponse = await fetch(`/api/orders?limit=10&startDate=${start}&endDate=${end}`);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(Array.isArray(ordersData) ? ordersData : 
                    (ordersData.orders ? ordersData.orders : []));
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        // Set empty values on error
        setOrders([]);
        setSalesData([]);
        setTopProducts([]);
        setStatsCards({
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          averageOrderValue: 0,
          revenueGrowth: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange, reportType]);

  // Set date range based on predefined periods
  const handleDateRangeChange = (period: string) => {
    const now = new Date();
    let start, end;
    
    switch(period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        setReportType('daily');
        break;
      case '7days':
        start = subDays(now, 7);
        end = new Date();
        setReportType('daily');
        break;
      case '30days':
        start = subDays(now, 30);
        end = new Date();
        setReportType('daily');
        break;
      case 'this-month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        setReportType('daily');
        break;
      case 'this-year':
        start = startOfYear(now);
        end = endOfYear(now);
        setReportType('monthly');
        break;
      default:
        start = subDays(new Date(), 30);
        end = new Date();
        setReportType('daily');
    }
    
    setDateRange({ start, end });
  };

  // Export report as CSV
  const exportCSV = () => {
    if (!orders || orders.length === 0) {
      alert("No data available to export");
      return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Order Number,Customer,Items,Subtotal,Tax,Shipping,Discount,Total,Status\n";
    
    orders.forEach(order => {
      const row = [
        order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd') : '',
        order.orderNumber || '',
        `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`,
        order.items?.length || 0,
        order.amount?.subtotal || 0,
        order.amount?.tax || 0,
        order.amount?.shipping || 0,
        order.amount?.discount || 0,
        order.amount?.total || 0,
        order.status || ''
      ].join(",");
      
      csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle order details expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prevState => {
      const newState = new Set(prevState);
      if (newState.has(orderId)) {
        newState.delete(orderId);
      } else {
        newState.add(orderId);
      }
      return newState;
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-50">
        <TopBar title="Sales Report" />
        
        <div className="p-6">
          {/* Report Controls */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap justify-between items-center">
            {/* Date Range Selector */}
            <div className="flex space-x-2 mb-3 md:mb-0">
              <button 
                onClick={() => handleDateRangeChange('today')}
                className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
              >
                Today
              </button>
              <button 
                onClick={() => handleDateRangeChange('7days')}
                className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => handleDateRangeChange('30days')}
                className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => handleDateRangeChange('this-month')}
                className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
              >
                This Month
              </button>
              <button 
                onClick={() => handleDateRangeChange('this-year')}
                className="px-3 py-1 rounded-md text-sm border hover:bg-gray-50"
              >
                This Year
              </button>
            </div>
            
            {/* Report Type & Export Button */}
            <div className="flex space-x-2">
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              
              <button 
                onClick={exportCSV}
                className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
                disabled={loading || orders.length === 0}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export CSV
              </button>
              <button
                onClick={async () => {
                  if (!orders || orders.length === 0) {
                    alert("No data available to export");
                    return;
                  }
                  const jsPDF = (await import("jspdf")).default;
                  const autoTable = (await import("jspdf-autotable")).default;
                  const doc = new jsPDF();
                  doc.text("Sales Report", 14, 16);
                  autoTable(doc, {
                    startY: 22,
                    head: [[
                      "Date", "Order Number", "Customer", "Items", "Subtotal", "Tax", "Shipping", "Discount", "Total", "Status"
                    ]],
                    body: orders.map(order => [
                      order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd') : '',
                      order.orderNumber || '',
                      `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`,
                      order.items?.length || 0,
                      order.amount?.subtotal || 0,
                      order.amount?.tax || 0,
                      order.amount?.shipping || 0,
                      order.amount?.discount || 0,
                      order.amount?.total || 0,
                      order.status || ''
                    ]),
                  });
                  doc.save(`sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
                }}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                disabled={loading || orders.length === 0}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export PDF
              </button>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Revenue Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${typeof statsCards.totalRevenue === 'number' 
                      ? statsCards.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                      : '0.00'}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-md h-fit">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className={`flex items-center mt-2 ${statsCards.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {statsCards.revenueGrowth >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span className="text-sm ml-1">
                  {Math.abs(statsCards.revenueGrowth).toFixed(1)}% from previous period
                </span>
              </div>
            </div>
            
            {/* Total Orders Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{statsCards.totalOrders.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-md h-fit">
                  <ShoppingBagIcon className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div className="text-gray-500 mt-2">
                <span className="text-sm">
                  {statsCards.totalItems ? 
                    `${statsCards.totalItems.toLocaleString()} items sold` : 
                    `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
                  }
                </span>
              </div>
            </div>
            
            {/* Average Order Value */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Order Value</p>
                  <p className="text-2xl font-bold">
                    ${typeof statsCards.averageOrderValue === 'number' 
                      ? statsCards.averageOrderValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                      : '0.00'}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-md h-fit">
                  <ChartBarIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="text-gray-500 mt-2">
                <span className="text-sm">
                  Based on {statsCards.totalOrders.toLocaleString()} orders
                </span>
              </div>
            </div>
            
            {/* Top Product Card */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Top Selling Product</p>
                  <p className="text-xl font-bold truncate max-w-[180px]">
                    {topProducts.length > 0 ? topProducts[0].name : 'No data'}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-md h-fit">
                  <ChartPieIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="text-gray-500 mt-2 flex items-center">
                {topProducts.length > 0 ? (
                  <div className="flex items-center">
                    <span className="text-sm mr-2">
                      {topProducts[0].sales.toLocaleString()} units
                    </span>
                    <span className="text-sm text-green-500">
                      (${topProducts[0].revenue.toLocaleString()})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm">No sales data available</span>
                )}
              </div>
            </div>
          </div>
          
          
            
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-medium mb-4">Revenue Over Time</h3>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : salesData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        name="Revenue ($)" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#82ca9d" 
                        name="Orders" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data available for the selected period
                </div>
              )}
            </div>
            
            {/* Top Products Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-medium mb-4">Top Selling Products</h3>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : topProducts.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" name="Units Sold" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No product data available
                </div>
              )}
            </div>
          </div>
          </div>
          
          
          {/* Recent Orders Table - Updated with expandable rows */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Recent Orders</h3>
              <div className="text-sm text-gray-500">
                Showing {Math.min(orders.length, 10)} of {orders.length} orders
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        Loading order data...
                      </td>
                    </tr>
                  ) : orders.length > 0 ? (
                    orders.slice(0, 10).map((order) => (
                      <React.Fragment key={order._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => toggleOrderExpansion(order._id)}
                              className="text-gray-500 hover:text-gray-800"
                            >
                              {expandedOrders.has(order._id) ? (
                                <ChevronUpIcon className="h-5 w-5" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {order.orderNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.createdAt ? format(parseISO(order.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${order.amount && order.amount.total ? order.amount.total.toFixed(2) : '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                              ${order.status === 'Order Completed' ? 'bg-green-100 text-green-800' : 
                                                order.status === 'Order Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'Shipping' ? 'bg-indigo-100 text-indigo-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                              {order.status || 'N/A'}
                                            </span>
                                          </td>
                                        </tr>
                                        {expandedOrders.has(order._id) && (
                                          <tr>
                                            {/* Expanded order row content if you have any */}
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={7} className="px-6 py-4 text-center">
                                        No orders found.
                                      </td>
                                    </tr>
                                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      
  );
};

export default SalesReportPage;

