"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  BellIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  CubeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { CogIcon, ShoppingCartIcon } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 orders per page
  const [totalPages, setTotalPages] = useState(1);

  // Add a CSS style for the spinner
  const spinnerStyle = {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeft: '4px solid #FF6A00',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  };

  // Add keyframes animation for the spinner
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    // Add the keyframes animation
    styleEl.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    // Append to the document head
    document.head.appendChild(styleEl);

    // Clean up
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    // Fetch orders from the API
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/orders", {
          // Adding cache: no-store to prevent caching
          cache: "no-store",
          headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
        
        // Set total pages
        const total = Math.ceil(data.length / itemsPerPage);
        setTotalPages(total > 0 ? total : 1);
        
        // Apply initial pagination
        applyPagination(data);
        setError("");
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [itemsPerPage]);

  // Apply pagination when page changes
  useEffect(() => {
    applyPagination(orders);
  }, [currentPage, orders]);
  
  // Handle pagination
  const applyPagination = (items: Order[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedOrders(items.slice(startIndex, endIndex));
  };
  
  // Handle pagination navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState("");

  // Filter orders based on selected status
  const filteredOrders = filterStatus
    ? orders.filter((order) => order.status === filterStatus)
    : orders;
  
  // Apply pagination to filtered orders
  useEffect(() => {
    applyPagination(filteredOrders);
    const total = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filterStatus, filteredOrders.length, itemsPerPage]);

  // Order summary counts
  const getOrderCountByStatus = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar with Icons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Orders List</h1>

          {/* Top-Right Icons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={() => router.push("/admin/notifications")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push("/admin/settings")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (e.g., Order History, Activity Log, etc.) */}
            <button
              onClick={() => router.push("/admin/history")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push("../../profilepage")}
              className="p-1 rounded-full border-2 border-gray-300"
            >
              <img
                src="/p9.webp"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Orders Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Confirmed Orders</h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : getOrderCountByStatus("Order Confirmed")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Order Shipped</h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : getOrderCountByStatus("Shipping")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CubeIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Out For Delivery</h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : getOrderCountByStatus("Out For Delivery")}
              </p>
            </div>
          </div>
        </div>

        {/* Products Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingCartIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Order Processing</h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : getOrderCountByStatus("Processing")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Delivered</h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : getOrderCountByStatus("Order Completed")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Order Confirm & Processing
              </h2>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : (
                  getOrderCountByStatus("Order Confirmed") +
                  getOrderCountByStatus("Processing")
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Orders List</h2>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="🔍 Search"
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {/* Order Status Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Order Completed">Order Completed</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Shipping">Shipping</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Order ID</th>
                <th className="p-3">Created At</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Order Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                /* Circular Loading Animation */
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex justify-center items-center h-32">
                      <div style={spinnerStyle}></div>
                      <span className="ml-3 text-orange-500 font-medium">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                /* Error state */
                <tr>
                  <td colSpan={6} className="p-3 text-center text-red-500">
                    {error} <button className="text-blue-500 underline" onClick={() => location.reload()}>Retry</button>
                  </td>
                </tr>
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{order.orderNumber}</td>
                    <td className="p-3">{order.createdAt.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-3">{order.customer.firstName}</td>
                    <td className="p-3">
                      <span className="text-orange-500">$</span>{" "}
                      {order.amount.total}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === "Order Confirmed"
                            ? "bg-blue-300 text-blue-800"
                            : order.status === "Order Completed"
                            ? "bg-green-300 text-green-800"
                            : order.status === "Out For Delivery"
                            ? "bg-orange-300 text-orange-800"
                            : order.status === "Shipping"
                            ? "bg-cyan-300 text-cyan-800"
                            : order.status === "Processing"
                            ? "bg-yellow-300 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => router.push(`/admin/orderdetails/${order._id}`)}
                        className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? "bg-orange-200 text-gray-700 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="mx-2 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? "bg-orange-200 text-gray-700 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
