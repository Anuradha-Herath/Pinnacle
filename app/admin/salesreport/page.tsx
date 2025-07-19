"use client";

import { useEffect, useState, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import TopBar from "@/app/components/admin/TopBar";
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
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
import {
  DollarSignIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  CalendarIcon,
  ArrowDownAZIcon,
  ActivityIcon,
  CreditCardIcon,
  FileDownIcon
} from "lucide-react";
import { format, subDays, parseISO, isValid } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Define the Order type according to your data structure
interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  amount: {
    subtotal: number;
    shippingCost: number;
    total: number;
  };
  status: string;
  paymentStatus: string;
  line_items: Array<{
    quantity: number;
    price_data: {
      unit_amount: number;
      product_data: string;
    };
    metadata: {
      productId: string;
    }
  }>;
}

// Payment status breakdown interface
interface PaymentBreakdown {
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
}

export default function SalesReportPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Sales metrics
  const [salesMetrics, setSalesMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalProductsSold: 0
  });

  // Add payment status breakdown
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({
    paid: 0,
    pending: 0,
    failed: 0,
    refunded: 0
  });
  
  // Sales by date for chart
  const [salesByDate, setSalesByDate] = useState<Array<{date: string, revenue: number, orders: number}>>([]);
  
  // Top selling products
  const [topProducts, setTopProducts] = useState<Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>>([]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Enhanced order fetching with better fallback mechanisms
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        console.log(`Fetching orders from API for date range: ${dateRange.startDate} to ${dateRange.endDate}`);
        
        // Use multiple API endpoints with fallbacks
        let orderData = null;
        let apiSuccess = false;
        
        // Try the direct orders API first (most reliable for raw data)
        try {
          console.log("Trying direct orders API...");
          const directResponse = await fetch(
            `/api/admin/direct-orders?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
          );
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            if (Array.isArray(data) && data.length > 0) {
              console.log(`Direct API success: ${data.length} orders`);
              orderData = data;
              apiSuccess = true;
              
              // Log the first order to understand its structure
              if (data.length > 0) {
                console.log("Sample order from direct API:", data[0]);
                
                // Check if line_items exists and has the expected structure
                if (data[0].line_items && Array.isArray(data[0].line_items)) {
                  console.log("Sample line item:", data[0].line_items[0]);
                } else {
                  console.warn("Order doesn't have properly structured line_items");
                }
              }
            }
          }
        } catch (directError) {
          console.error("Direct API failed:", directError);
        }
        
        // If direct API failed, try regular orders API
        if (!apiSuccess) {
          try {
            console.log("Trying regular orders API...");
            const queryParams = new URLSearchParams({
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              fields: 'orderNumber,createdAt,customer,amount,status,paymentStatus,line_items'
            }).toString();
            
            const response = await fetch(`/api/orders?${queryParams}`);
            
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data) && data.length > 0) {
                console.log(`Regular API success: ${data.length} orders`);
                orderData = data;
                apiSuccess = true;
              }
            }
          } catch (regularError) {
            console.error("Regular API failed:", regularError);
          }
        }
        
        // If both APIs failed, try sales report API
        if (!apiSuccess) {
          try {
            console.log("Trying sales report API...");
            const reportResponse = await fetch(
              `/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
            );
            
            if (reportResponse.ok) {
              const reportData = await reportResponse.json();
              if (reportData.success) {
                console.log("Using sales report data");
                
                // Use sales data directly
                if (reportData.salesData && reportData.salesData.length > 0) {
                  setSalesByDate(reportData.salesData);
                }
                
                if (reportData.topProducts && reportData.topProducts.length > 0) {
                  const formattedProducts = reportData.topProducts.map((product: any) => ({
                    productName: product.name,
                    quantity: product.sales,
                    revenue: product.revenue
                  }));
                  setTopProducts(formattedProducts);
                }
                
                if (reportData.stats) {
                  setSalesMetrics({
                    totalRevenue: reportData.stats.totalRevenue || 0,
                    totalOrders: reportData.stats.totalOrders || 0,
                    averageOrderValue: reportData.stats.averageOrderValue || 0,
                    totalProductsSold: reportData.stats.totalItems || 0
                  });
                  
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (reportError) {
            console.error("Sales report API failed:", reportError);
          }
        }
        
        // Process order data if we got any
        if (orderData && Array.isArray(orderData)) {
          console.log(`Processing ${orderData.length} orders`);
          
          // Normalize and validate order data
          const normalizedOrders = orderData.map(order => normalizeOrderData(order));
          
          // Update state with normalized orders
          setOrders(normalizedOrders);
          
          // Filter to only show paid orders
          const paidOrders = normalizedOrders.filter(isPaidOrder);
          
          setFilteredOrders(paidOrders);
          
          // Calculate metrics with improved logic
          const metricsResult = calculateMetrics(normalizedOrders);
          
          // Set metrics
          // Use filteredOrders.length for totalOrders to match dashboard's count of paid orders
          setSalesMetrics({
            totalRevenue: metricsResult.totalRevenue,
            totalOrders: paidOrders.length, // Use filtered paid orders count to match dashboard
            averageOrderValue: metricsResult.averageOrderValue,
            totalProductsSold: metricsResult.totalProductsSold
          });
          
          // Set payment breakdown
          setPaymentBreakdown(metricsResult.paymentBreakdown);
          
          // Process data for charts and product analysis
          processSalesData(normalizedOrders);
          
          // Verify revenue calculation (optional)
          verifyRevenueCalculation(normalizedOrders);
        } else {
          console.error("Failed to retrieve any order data from all API endpoints");
          resetMetrics();
        }
      } catch (error) {
        console.error("Error in order fetching process:", error);
        resetMetrics();
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dateRange]);

  // Normalize order data to ensure consistent structure
  const normalizeOrderData = (order: any): Order => {
    if (!order) return {} as Order;
    
    // Ensure all required fields exist
    const normalized = {
      _id: order._id || `temp-${Date.now()}`,
      orderNumber: order.orderNumber || `ORD-${Date.now()}`,
      createdAt: order.createdAt || new Date().toISOString(),
      customer: {
        firstName: order.customer?.firstName || "Unknown",
        lastName: order.customer?.lastName || "Customer"
      },
      amount: {
        subtotal: typeof order.amount?.subtotal === 'number' ? order.amount.subtotal : 0,
        shippingCost: typeof order.amount?.shippingCost === 'number' ? order.amount.shippingCost : 0,
        total: typeof order.amount?.total === 'number' ? order.amount.total : 0
      },
      status: order.status || "Unknown",
      paymentStatus: order.paymentStatus || order.status || "Unknown",
      line_items: []
    };
    
    // Normalize line items
    if (order.line_items && Array.isArray(order.line_items)) {
      normalized.line_items = order.line_items.map((item: any) => {
        // Handle different line item structures
        if (!item) return null;
        
        return {
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          price_data: {
            unit_amount: item.price_data?.unit_amount || (item.price ? item.price * 100 : 0),
            product_data: item.price_data?.product_data || item.name || "Unknown Product"
          },
          metadata: {
            productId: item.metadata?.productId || item.productId || "unknown"
          }
        };
      }).filter(Boolean);  // Remove any null items
    }
    
    return normalized as Order;
  };

  // Helper function to check if an order is considered "paid"
  const isPaidOrder = (order: Order): boolean => {
    return order.paymentStatus?.toLowerCase() === "paid" || 
           order.status === "Processing" || 
           order.status === "Shipped" || 
           order.status === "Delivered" ||
           order.status?.toLowerCase() === "paid";
  };

  // Helper function to reset metrics when there's an error
  const resetMetrics = () => {
    setSalesMetrics({
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalProductsSold: 0
    });
    setPaymentBreakdown({
      paid: 0,
      pending: 0,
      failed: 0,
      refunded: 0
    });
    setSalesByDate([]);
    setTopProducts([]);
  };

  // Process sales data with enhanced error handling
  const processSalesData = (orders: Order[]) => {
    try {
      // Calculate sales by date for chart (only count revenue from paid orders)
      const salesMap = new Map<string, {revenue: number, orders: number}>();
      
      orders.forEach(order => {
        // Skip invalid orders
        if (!order.createdAt || !order.amount?.total) {
          console.warn("Skipping order with missing data:", order._id);
          return;
        }
        
        // Only count paid orders for revenue chart
        if (!isPaidOrder(order)) {
          return;
        }
        
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const currentData = salesMap.get(date) || { revenue: 0, orders: 0 };
        salesMap.set(date, {
          revenue: currentData.revenue + (order.amount?.total || 0),
          orders: currentData.orders + 1
        });
      });
      
      // Sort dates and format for chart
      const salesData = Array.from(salesMap.entries())
        .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setSalesByDate(salesData);
      
      // Calculate top selling products with enhanced validation (only from paid orders)
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      
      let productsProcessed = 0;
      
      orders.forEach(order => {
        // Only count products from paid orders
        if (!isPaidOrder(order)) {
          return;
        }
        
        if (!order.line_items || !Array.isArray(order.line_items)) {
          console.warn(`Order ${order._id} missing line_items array`);
          return;
        }
        
        order.line_items.forEach(item => {
          // Skip invalid items
          if (!item || !item.price_data || !item.price_data.product_data) {
            console.warn("Skipping invalid line item in order:", order._id);
            return;
          }
          
          const productName = item.price_data.product_data;
          const currentData = productMap.get(productName) || { quantity: 0, revenue: 0 };
          
          // Calculate item total safely
          const quantity = item.quantity || 0;
          const unitAmount = item.price_data.unit_amount || 0;
          const itemTotal = (unitAmount / 100) * quantity;
          
          productMap.set(productName, {
            quantity: currentData.quantity + quantity,
            revenue: currentData.revenue + itemTotal
          });
          
          productsProcessed++;
        });
      });
      
      console.log(`Processed ${productsProcessed} product line items across all paid orders`);
      
      // Get top 10 products by sales
      const topProductsData = Array.from(productMap.entries())
        .map(([productName, data]) => ({
          productName,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      console.log(`Top products found: ${topProductsData.length}`);
      setTopProducts(topProductsData);
    } catch (error) {
      console.error("Error processing sales data:", error);
      setSalesByDate([]);
      setTopProducts([]);
    }
  };

  // Improved function to calculate metrics with better revenue logic
  const calculateMetrics = (orders: Order[]) => {
    console.log(`Calculating metrics for ${orders.length} orders`);
    
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      console.log("No valid orders to calculate metrics");
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalProductsSold: 0,
        paymentBreakdown: {
          paid: 0,
          pending: 0,
          failed: 0,
          refunded: 0
        }
      };
    }

    try {
      // Payment status totals
      const paymentTotals = {
        paid: 0,
        pending: 0,
        failed: 0,
        refunded: 0
      };

      let totalRevenue = 0;
      let paidOrdersCount = 0;
      let totalProductsSold = 0;

      orders.forEach(order => {
        const orderTotal = order.amount?.total;
        
        // Skip orders with invalid totals
        if (typeof orderTotal !== 'number' || isNaN(orderTotal)) {
          console.warn(`Order ${order._id || 'unknown'} has invalid total:`, orderTotal);
          return;
        }

        // Determine order status for revenue calculation
        const isPaid = isPaidOrder(order);
        const isPending = order.paymentStatus === "Pending" || order.status === "Pending";
        const isFailed = order.paymentStatus === "Failed";
        const isRefunded = order.paymentStatus === "Refunded" || order.status === "Refunded";

        // Track payment breakdown and revenue
        if (isPaid) {
          paymentTotals.paid += orderTotal;
          totalRevenue += orderTotal; // Add to revenue
          paidOrdersCount++;
        } else if (isPending) {
          paymentTotals.pending += orderTotal;
          // Decision: Don't include pending in revenue for now
          // Uncomment the next line if you want to include pending orders in revenue:
          // totalRevenue += orderTotal;
        } else if (isFailed) {
          paymentTotals.failed += orderTotal;
          // Failed orders don't contribute to revenue
        } else if (isRefunded) {
          paymentTotals.refunded += orderTotal;
          totalRevenue -= orderTotal; // Subtract refunded amount
        } else {
          // Default case - treat as paid if we have an amount
          console.warn(`Order ${order._id} has unclear status: ${order.status}/${order.paymentStatus}`);
          paymentTotals.paid += orderTotal;
          totalRevenue += orderTotal;
          paidOrdersCount++;
        }

        // Calculate total products sold (only from paid orders)
        if (isPaid || (!isPending && !isFailed && !isRefunded)) {
          if (order.line_items && Array.isArray(order.line_items)) {
            totalProductsSold += order.line_items.reduce((itemSum, item) => {
              const quantity = item.quantity;
              return itemSum + (typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0);
            }, 0);
          }
        }
      });

      // Calculate average order value based on paid orders only
      const averageOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

      console.log(`Revenue calculation complete:`);
      console.log(`- Total revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`- Paid orders count: ${paidOrdersCount}`);
      console.log(`- Total orders: ${orders.length}`);
      console.log(`- Payment breakdown:`, paymentTotals);

      return {
        totalRevenue,
        totalOrders: paidOrdersCount, // Count of paid orders only
        averageOrderValue,
        totalProductsSold,
        paymentBreakdown: paymentTotals
      };

    } catch (error) {
      console.error("Error calculating metrics:", error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalProductsSold: 0,
        paymentBreakdown: {
          paid: 0,
          pending: 0,
          failed: 0,
          refunded: 0
        }
      };
    }
  };

  // Revenue verification function
  const verifyRevenueCalculation = (orders: Order[]) => {
    try {
      // Calculate revenue from order totals (paid orders only)
      const revenueFromOrderTotals = orders.reduce((sum, order) => {
        const orderTotal = order.amount?.total;
        if (typeof orderTotal === 'number' && !isNaN(orderTotal)) {
          // Only count paid orders
          if (isPaidOrder(order)) {
            return sum + orderTotal;
          }
          // Subtract refunded orders
          if (order.paymentStatus === "Refunded" || order.status === "Refunded") {
            return sum - orderTotal;
          }
        }
        return sum;
      }, 0);

      // Calculate revenue from line items (verification)
      const revenueFromLineItems = orders.reduce((sum, order) => {
        if (!order.line_items || !Array.isArray(order.line_items)) {
          return sum;
        }
        
        // Only calculate for paid orders
        if (!isPaidOrder(order)) {
          // Handle refunded orders
          if (order.paymentStatus === "Refunded" || order.status === "Refunded") {
            const orderLineItemTotal = order.line_items.reduce((itemSum, item) => {
              const quantity = item.quantity || 0;
              const unitAmount = item.price_data?.unit_amount || 0;
              return itemSum + (unitAmount / 100) * quantity;
            }, 0);
            return sum - orderLineItemTotal; // Subtract refunded
          }
          return sum;
        }
        
        const orderLineItemTotal = order.line_items.reduce((itemSum, item) => {
          const quantity = item.quantity || 0;
          const unitAmount = item.price_data?.unit_amount || 0;
          return itemSum + (unitAmount / 100) * quantity; // Convert cents to dollars
        }, 0);
        
        return sum + orderLineItemTotal;
      }, 0);

      console.log(`Revenue verification:`);
      console.log(`- From order totals: $${revenueFromOrderTotals.toFixed(2)}`);
      console.log(`- From line items: $${revenueFromLineItems.toFixed(2)}`);
      console.log(`- Difference: $${Math.abs(revenueFromOrderTotals - revenueFromLineItems).toFixed(2)}`);

      // Alert if there's a significant discrepancy
      const difference = Math.abs(revenueFromOrderTotals - revenueFromLineItems);
      if (difference > 0.01) {
        console.warn(`Revenue calculation discrepancy detected: $${difference.toFixed(2)}`);
      }
    } catch (error) {
      console.error("Error in revenue verification:", error);
    }
  };

  // Export report as CSV
  const exportCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert("No data available to export");
      return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Order Number,Customer,Total,Status,Payment Status\n";
    
    filteredOrders.forEach(order => {
      const row = [
        order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd') : '',
        order.orderNumber || '',
        `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`,
        order.amount?.total || 0,
        order.status || '',
        order.paymentStatus || ''
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

  // Add a debugging component that can be toggled
  const [showDebug, setShowDebug] = useState(false);
  
  // Add a ref for the report content
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  // Function to generate and download PDF
  const generatePDF = async () => {
    if (!reportContentRef.current) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Get the report container
      const reportContainer = reportContentRef.current;
      
      // Apply color normalization to ensure consistent colors in PDF
      // This adds a temporary style to fix color rendering issues
      const normalizeColors = () => {
        const elements = reportContainer.querySelectorAll('*');
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            // Store original color if it exists
            const originalColor = el.style.color;
            const computedStyle = window.getComputedStyle(el);
            const computedColor = computedStyle.color;
            
            // Force color redraw to ensure correct rendering
            if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
              el.setAttribute('data-original-color', originalColor);
              el.style.color = computedColor;
            }
          }
        });
      };
      
      // Normalize colors before rendering
      normalizeColors();
      
      // Create canvas from the container with improved color settings
      const canvas = await html2canvas(reportContainer, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Enable CORS for images
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true, // Allow tainted canvas for better color reproduction
        foreignObjectRendering: false, // Disable ForeignObject rendering to fix color issues
        removeContainer: true, // Remove container after rendering to avoid artifacts
        imageTimeout: 0, // No timeout for image loading
      });
      
      // Calculate PDF dimensions (maintain aspect ratio)
      const imgWidth = 210; // A4 width in mm (210mm)
      const pageHeight = 297; // A4 height in mm (297mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('Sales Report', 105, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 105, 22, { align: 'center' });
      
      // Add date range
      pdf.text(`Period: ${format(new Date(dateRange.startDate), 'MMMM d, yyyy')} - ${format(new Date(dateRange.endDate), 'MMMM d, yyyy')}`, 105, 28, { align: 'center' });
      
      // Add image (starting after the title)
      position = 35;
      
      // If image is larger than page, create multiple pages
      let heightLeft = imgHeight;
      
      // Add first page image with color correction
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0), // Using JPEG format for better color reproduction
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST',
        0
      );
      heightLeft -= (pageHeight - position);
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = 0;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0), // Using JPEG format for better color reproduction
          'JPEG',
          0,
          position - (pageHeight - position),
          imgWidth,
          imgHeight,
          undefined,
          'FAST',
          0
        );
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      // Restore original colors after PDF generation
      const restoreColors = () => {
        const elements = reportContainer.querySelectorAll('[data-original-color]');
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            const originalColor = el.getAttribute('data-original-color');
            if (originalColor) {
              el.style.color = originalColor;
              el.removeAttribute('data-original-color');
            }
          }
        });
      };
      
      // Restore colors
      restoreColors();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        <TopBar heading="Sales Report" />

        {/* Add note about order counts */}
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4">
          <strong>Note:</strong> This report shows only paid orders (including orders with status "paid", "Processing", "Shipped", and "Delivered") within the selected date range, matching the dashboard metrics.
        </div>

        {/* Add debug toggle */}
        <div className="mb-4 flex justify-end">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        </div>

        {/* Debug Information Panel */}
        {showDebug && (
          <div className="bg-gray-100 p-4 mb-6 rounded-lg border border-gray-300 text-xs">
            <h3 className="font-bold mb-2">Debug Information</h3>
            <p>Total Orders Fetched: {orders.length}</p>
            <p>Paid Orders (matching dashboard count): {filteredOrders.length}</p>
            <p>Dashboard Total Orders Count: {salesMetrics.totalOrders}</p>
            <p>Date Range: {dateRange.startDate} to {dateRange.endDate}</p>
            <p>Total Revenue (Paid Orders Only): ${salesMetrics.totalRevenue.toFixed(2)}</p>
            <p>Average Order Value (Paid Orders): ${salesMetrics.averageOrderValue.toFixed(2)}</p>
            <div className="mt-2">
              <strong>Payment Breakdown:</strong>
              <p>Paid: ${paymentBreakdown.paid.toFixed(2)}</p>
              <p>Pending: ${paymentBreakdown.pending.toFixed(2)}</p>
              <p>Failed: ${paymentBreakdown.failed.toFixed(2)}</p>
              <p>Refunded: ${paymentBreakdown.refunded.toFixed(2)}</p>
            </div>
            <details>
              <summary className="cursor-pointer">Sample Order Data (first 3)</summary>
              <pre className="mt-2 overflow-x-auto">
                {JSON.stringify(orders.slice(0, 3), null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
            Select Date Range
          </h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Quick Date Selectors */}
            <div className="flex space-x-2 ml-4">
              <button 
                onClick={() => setDateRange({
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Today
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: subDays(new Date(), 7).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setDateRange({
                  startDate: subDays(new Date(), 30).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                Last 30 Days
              </button>
            </div>
            
            {/* Export Buttons */}
            <div className="flex ml-auto">
              <button 
                onClick={exportCSV}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 mr-2"
                disabled={loading || filteredOrders.length === 0}
              >
                <ArrowDownAZIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              
              <button 
                onClick={generatePDF}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading || filteredOrders.length === 0}
              >
                <FileDownIcon className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-500">Loading sales data...</p>
          </div>
        ) : (
          <div ref={reportContentRef} className="print-container">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Revenue Card */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Revenue</p>
                    <h3 className="text-2xl font-bold">
                      ${salesMetrics.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </h3>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <DollarSignIcon className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  From {filteredOrders.length.toLocaleString()} paid orders in selected period
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Orders</p>
                    <h3 className="text-2xl font-bold">
                      {salesMetrics.totalOrders.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">(Paid orders only)</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ShoppingBagIcon className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {salesMetrics.totalProductsSold.toLocaleString()} total items sold
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Average Order Value</p>
                    <h3 className="text-2xl font-bold">
                      ${salesMetrics.averageOrderValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </h3>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUpIcon className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Based on completed orders
                </p>
              </div>
            </div>
            
            
            {/* Additional Overall Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <ActivityIcon className="mr-2 h-5 w-5 text-orange-500" />
                Overall Sales Performance (All Orders in Date Range)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Daily Average Revenue</p>
                  <p className="text-xl font-semibold mt-1">
                    ${salesByDate.length > 0 
                      ? (salesMetrics.totalRevenue / salesByDate.length).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      : '0.00'
                    }
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Daily Average Orders</p>
                  <p className="text-xl font-semibold mt-1">
                    {salesByDate.length > 0
                      ? (salesMetrics.totalOrders / salesByDate.length).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })
                      : '0'
                    }
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Items Per Order</p>
                  <p className="text-xl font-semibold mt-1">
                    {salesMetrics.totalOrders > 0
                      ? (salesMetrics.totalProductsSold / salesMetrics.totalOrders).toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })
                      : '0'
                    }
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Revenue Per Item</p>
                  <p className="text-xl font-semibold mt-1">
                    ${salesMetrics.totalProductsSold > 0
                      ? (salesMetrics.totalRevenue / salesMetrics.totalProductsSold).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      : '0.00'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
                {salesByDate.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesByDate}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{fontSize: 12}}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue" 
                          stroke="#f97316" 
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No data available for the selected period
                  </div>
                )}
              </div>
              
              {/* Orders Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Order Volume</h2>
                {salesByDate.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesByDate}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{fontSize: 12}}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="orders" 
                          name="Orders" 
                          fill="#f97316" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No data available for the selected period
                  </div>
                )}
              </div>
            </div>
            
            
            
            {/* Recent Orders Table */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.slice(0, 10).map((order) => (
                        <tr key={order._id} className="border-t">
                          <td className="p-3">{order.orderNumber || "N/A"}</td>
                          <td className="p-3">
                            {order.createdAt ? format(parseISO(order.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="p-3">
                            {order.customer ? 
                              `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 
                              'N/A'
                            }
                          </td>
                          <td className="p-3">
                            <span className="text-orange-500">$</span>
                            {order.amount?.total.toFixed(2) || "0.00"}
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === "Delivered" ? "bg-green-100 text-green-800" :
                              order.status === "Shipped" ? "bg-blue-100 text-blue-800" :
                              order.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                              order.status === "Paid" ? "bg-orange-100 text-orange-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {order.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-gray-500">
                          No orders found for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}