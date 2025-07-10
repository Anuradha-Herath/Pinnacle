"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import TopBar from "@/app/components/TopBar";
import { 
  ChartBarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  ChartPieIcon, 
  ArrowDownTrayIcon 
} from "@heroicons/react/24/solid";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";

// Import chart components from a chart library (you'll need to install one)
// For example: npm install recharts
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
  const router = useRouter();
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

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Fetch order data with improved error handling
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // Get date range params for API
        const start = dateRange.start.toISOString();
        const end = dateRange.end.toISOString();
        
        // First fetch order counts to get accurate total orders
        const orderCountResponse = await fetch('/api/orders?count=true');
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
            // Use order count from orders API if available, otherwise use value from sales data
            totalOrders: orderCountData.totalCount || data.stats.totalOrders || 0,
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

  // Helper function to get date range period string
  const getDateRangePeriod = () => {
    // Calculate how many days between start and end dates
    const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'today';
    if (diffDays <= 7) return '7days';
    if (diffDays <= 31) return '30days';
    
    const startMonth = dateRange.start.getMonth();
    const endMonth = dateRange.end.getMonth();
    const sameMonth = startMonth === endMonth && 
                      dateRange.start.getFullYear() === dateRange.end.getFullYear();
    
    if (sameMonth) return 'this-month';
    return '30days'; // Default
  };

  // (Removed duplicate handleDateRangeChange declaration)

  // Process data when orders or date range changes - Add null checks
  useEffect(() => {
    // Make sure orders is defined and is an array before proceeding
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      // Set default empty values for derived states
      setSalesData([]);
      setTopProducts([]);
      setStatsCards({
        totalRevenue: 0,
        totalOrders: 0,
        totalItems: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
      });
      return;
    }
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      try {
        const orderDate = parseISO(order.createdAt);
        return orderDate >= dateRange.start && orderDate <= dateRange.end;
      } catch (error) {
        console.error("Error parsing date:", error, order);
        return false;
      }
    });
    
    // Process data for sales chart
    const processedSalesData = processSalesData(filteredOrders, reportType);
    setSalesData(processedSalesData);
    
    // Calculate top selling products
    const processedProductData = processTopProducts(filteredOrders);
    setTopProducts(processedProductData);
    
    // Calculate stats for cards
    const stats = calculateStats(filteredOrders);
    setStatsCards(stats);
    
  }, [orders, dateRange, reportType]);

  // Process sales data for charts
  const processSalesData = (filteredOrders: Order[], type: string): SalesData[] => {
    if (!filteredOrders || !Array.isArray(filteredOrders) || filteredOrders.length === 0) {
      return [];
    }
    
    // Group orders by date according to report type
    const salesByDate = new Map<string, { revenue: number; orders: number }>();
    
    filteredOrders.forEach(order => {
      const orderDate = parseISO(order.createdAt);
      let dateKey: string;
      
      switch(type) {
        case 'daily':
          dateKey = format(orderDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          // Using ISO week (1-53)
          dateKey = `Week ${format(orderDate, 'w')} - ${format(orderDate, 'yyyy')}`;
          break;
        case 'monthly':
          dateKey = format(orderDate, 'MMM yyyy');
          break;
        case 'yearly':
          dateKey = format(orderDate, 'yyyy');
          break;
        default:
          dateKey = format(orderDate, 'yyyy-MM-dd');
      }
      
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, { revenue: 0, orders: 0 });
      }
      
      const current = salesByDate.get(dateKey)!;
      salesByDate.set(dateKey, {
        revenue: current.revenue + order.amount.total,
        orders: current.orders + 1
      });
    });
    
    // Convert Map to array for chart
    return Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      revenue: Number(data.revenue.toFixed(2)),
      orders: data.orders
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process top selling products - with additional safeguards
  const processTopProducts = (filteredOrders: Order[]): ProductSales[] => {
    if (!filteredOrders || !Array.isArray(filteredOrders) || filteredOrders.length === 0) {
      return [];
    }
    
    const productSales = new Map<string, { sales: number, revenue: number }>();
    
    filteredOrders.forEach(order => {
      // Skip orders without items array
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach(item => {
        // Ensure item has name and price
        if (!item || !item.name) return;
        
        const itemName = item.name;
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        
        if (!productSales.has(itemName)) {
          productSales.set(itemName, { sales: 0, revenue: 0 });
        }
        
        const current = productSales.get(itemName)!;
        productSales.set(itemName, {
          sales: current.sales + itemQuantity,
          revenue: current.revenue + (itemPrice * itemQuantity)
        });
      });
    });
    
    // Convert to array and sort by sales count
    return Array.from(productSales.entries())
      .map(([name, data]) => ({
        name,
        sales: data.sales,
        revenue: Number(data.revenue.toFixed(2))
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5 products
  };

  const calculateStats = (filteredOrders: Order[]) => {
    if (!filteredOrders || !Array.isArray(filteredOrders)) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalItems: 0,
        averageOrderValue: 0,
        revenueGrowth: 0
      };
    }
    
    let totalRevenue = 0;
    let totalOrders = filteredOrders.length;
    let totalItems = 0;
    
    filteredOrders.forEach(order => {
      totalRevenue += order.amount.total;
      totalItems += order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    });
    
    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate revenue growth (placeholder - this would need previous period data)
    // For now, just use a random number as an example
    const revenueGrowth = Math.random() > 0.5 ? 
      Math.random() * 20 : -Math.random() * 10;
      
    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalItems,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      revenueGrowth: Number(revenueGrowth.toFixed(2))
    };
  };

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
    
    // After setting date range, fetch new data
    const fetchNewData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          period,
          reportType
        });
        
        const response = await fetch(`/api/reports/sales?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSalesData(data.salesData || []);
            setTopProducts(data.topProducts || []);
            setStatsCards(data.stats || {
              totalRevenue: 0,
              totalOrders: 0,
              averageOrderValue: 0,
              revenueGrowth: 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching new date range data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewData();
  };

  // Export report as CSV
  const exportCSV = () => {
    if (orders.length === 0) return;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Order Number,Customer,Items,Subtotal,Tax,Shipping,Discount,Total\n";
    
    orders.forEach(order => {
      const row = [
        order.createdAt.split("T")[0],
        order.orderNumber,
        `${order.customer.firstName} ${order.customer.lastName}`,
        order.items.length,
        order.amount.subtotal,
        order.amount.tax,
        order.amount.shipping,
        order.amount.discount,
        order.amount.total
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
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export Report
              </button>
            </div>
          </div>
          
          {/* Stats Cards - Enhanced with better formatting and data display */}
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
      </div>
    </div>
  );
};

export default SalesReportPage;