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

// Define the Order interface
interface Order {
  _id: string;
  orderNumber?: string;
  createdAt?: string;
  customer?: {
    firstName: string;
    lastName: string;
  };
  amount?: {
    total: number;
  };
  status?: string;
}

export default function OrdersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState("");

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 orders per page
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Fetch orders from the API
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders");
        
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        
        const data = await response.json();
        
        // Check if data has the orders property and it's an array
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else if (Array.isArray(data)) {
          // Handle the case where the API might return an array directly
          setOrders(data);
        } else {
          console.error("Unexpected data format:", data);
          throw new Error("Received invalid data format from API");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on selected status
  const filteredOrders = filterStatus
    ? orders.filter((order) => order.status === filterStatus)
    : orders;

  // Apply pagination when filtered orders or page changes
  useEffect(() => {
    applyPagination(filteredOrders);
    // Calculate total pages
    const total = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
  }, [currentPage, filteredOrders, itemsPerPage]);

  // Handle pagination
  const applyPagination = (items: Order[]) => {
    if (!Array.isArray(items)) {
      console.error("Expected items to be an array but got:", items);
      setDisplayedOrders([]);
      return;
    }
    
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

  // Function to view order details
  const handleViewOrder = (orderId: string) => {
    router.push(`/admin/adminorderdetails?id=${orderId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-2">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold">200</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Order Shipped</h2>
              <p className="text-2xl font-bold">200</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CubeIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Out For Delivery</h2>
              <p className="text-2xl font-bold">200</p>
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
              <p className="text-2xl font-bold">200</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Delivered</h2>
              <p className="text-2xl font-bold">200</p>
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
              <p className="text-2xl font-bold">656</p>
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
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when filter changes
                }}
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
                {/* <th className="p-3">Delivery Number</th> */}
                <th className="p-3">Order Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order, index) => (
                  <tr key={order._id || index} className="border-t">
                    <td className="p-3">{order.orderNumber || "N/A"}</td>
                    <td className="p-3">
                      {order.createdAt
                        ? order.createdAt.replace("T", " ").substring(0, 19)
                        : "N/A"}
                    </td>
                    <td className="p-3">
                      {order.customer?.firstName || "N/A"}
                    </td>
                    <td className="p-3">
                      <span className="text-orange-500">$</span>{" "}
                      {order.amount?.total || "N/A"}
                    </td>
                    {/* <td className="p-3">{order.deliveryNumber}</td> */}
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
                            : order.status === "Processing" ||
                              order.status === "pending"
                            ? "bg-yellow-300 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => handleViewOrder(order._id)}
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

          {/* Pagination - Updated */}
          {filteredOrders.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
