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
import { useAuth } from "@/app/context/AuthContext";

// Define Order interface for type safety
interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName?: string;
    email?: string;
  };
  totalPrice: number;
  status: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({
    processing: 0,
    shipping: 0,
    outForDelivery: 0,
    delivered: 0,
    confirmed: 0,
  });
  const [profilePicture, setProfilePicture] = useState<string>('/p9.webp');
  
  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState("");

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 orders per page
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);

  // Fetch profile data to get the current profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch('/api/profile?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user.profilePicture) {
            setProfilePicture(data.user.profilePicture);
          }
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
  }, []);

  useEffect(() => {
    // Fetch orders from the API
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }
        const data = await response.json();

        console.log("Fetched orders:", data);
        setOrders(data);

        // Count orders by status
        const statusCounts = {
          processing: 0,
          shipping: 0,
          outForDelivery: 0,
          delivered: 0,
          confirmed: 0,
        };

        data.forEach((order: Order) => {
          if (order.status === "Processing") statusCounts.processing++;
          else if (order.status === "Shipping") statusCounts.shipping++;
          else if (order.status === "Out For Delivery")
            statusCounts.outForDelivery++;
          else if (order.status === "Delivered") statusCounts.delivered++;
          else if (order.status === "Order Confirmed") statusCounts.confirmed++;
        });

        setCounts(statusCounts);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders");
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
    // Calculate total pages
    const total = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [currentPage, filteredOrders, itemsPerPage]);

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

            {/* Profile - Updated to use dynamic image and go to adminprofile */}
            <button
              onClick={() => router.push("/adminprofile")}
              className="p-1 rounded-full border-2 border-gray-300"
            >
              <img
                src={`${profilePicture}?t=${Date.now()}`}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = '/p9.webp';
                }}
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
              <p className="text-2xl font-bold">{counts.confirmed}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Order Shipped</h2>
              <p className="text-2xl font-bold">{counts.shipping}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CubeIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Out For Delivery</h2>
              <p className="text-2xl font-bold">{counts.outForDelivery}</p>
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
              <p className="text-2xl font-bold">{counts.processing}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Delivered</h2>
              <p className="text-2xl font-bold">{counts.delivered}</p>
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
                {counts.confirmed + counts.processing}
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
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when filter changes
                }}
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="Delivered">Delivered</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Shipping">Shipping</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : displayedOrders.length > 0 ? (
                  displayedOrders.map((order, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {order.orderNumber || order._id.substring(0, 8)}
                      </td>
                      <td className="p-3">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {order.customer.firstName} {order.customer.lastName}
                      </td>
                      <td className="px-4 py-3">
                        Rs. {order.totalPrice?.toFixed(2) || "N/A"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === "Order Confirmed"
                              ? "bg-blue-300 text-blue-800"
                              : order.status === "Delivered"
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
                          className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                          onClick={() => router.push(`/order-details/${order._id}`)}
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
          </div>

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
