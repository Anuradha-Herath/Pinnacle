"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowPathIcon,
  GiftIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import TopBar from "@/app/components/admin/TopBar";

// Define the Order type according to your data structure
interface Order {
  paymentStatus: string;
  _id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    firstName: string;
  };
  amount: {
    total: number;
  };
  status: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState("");

  // Add search state
  const [searchQuery, setSearchQuery] = useState("");

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 orders per page
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);

  // Function to get count of orders by status
  const getOrderCountByStatus = (status: string) => {
    return orders.filter(
      (order) => order.status === status && order.paymentStatus === "paid"
    ).length;
  };

  // Simple fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial fetch
  }, []);

  // Simple auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchOrders();
    };

    // Listen for when the window gains focus (user comes back to tab/browser)
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Filter orders based on selected status and search query, then apply pagination
  useEffect(() => {
    let filteredOrders = orders;

    // Filter by status
    if (filterStatus) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status === filterStatus
      );
    }

    // Filter by search query (order number)
    if (searchQuery) {
      filteredOrders = filteredOrders.filter((order) =>
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Calculate total pages
    const total = Math.ceil(filteredOrders.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedOrders(filteredOrders.slice(startIndex, endIndex));
  }, [orders, filterStatus, searchQuery, currentPage, itemsPerPage]);

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
        <TopBar heading="Order List" />

        {/* Orders Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orders Paid</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Paid")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowPathIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orders Processing</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Processing")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TruckIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orders Shipped</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Shipped")}
              </p>
            </div>
          </div>
        </div>

        {/* Products Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <GiftIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orders Delivered</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Delivered")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CubeIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orders Processed</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Processed")}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowUturnLeftIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Refunded</h2>
              <p className="text-2xl font-bold">
                {getOrderCountByStatus("Refunded")}
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
              <div className="relative inline-block">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder=" Search by Order ID"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to page 1 when search changes
                  }}
                  className="pl-7 py-[6px] pr-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ width: "calc(18ch + 1.75rem)" }} // ch == character width
                />
              </div>

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
                <option value="Paid">Paid</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Processed">Processed</option>
                <option value="Delivered">Delivered</option>
                <option value="Refunded">Refunded</option>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-orange-500 mb-2"></div>
                      <span className="text-gray-700 text-base">
                        Loading...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : displayedOrders.length > 0 ? (
                displayedOrders.map((order: Order) => (
                  <tr key={order._id} className="border-t">
                    <td className="p-3">{order.orderNumber || "N/A"}</td>
                    <td className="p-3">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="p-3">
                      {order.customer?.firstName || "N/A"}
                    </td>
                    <td className="p-3">
                      <span className="text-orange-500">$</span>
                      {order.amount?.total.toFixed(2) || "N/A"}
                    </td>
                    {/* <td className="p-3">{order.deliveryNumber}</td> */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          order.status === "Refunded"
                            ? "bg-red-300 text-red-800"
                            : order.status === "Delivered"
                            ? "bg-orange-300 text-orange-800"
                            : order.status === "Processed"
                            ? "bg-blue-300 text-blue-800"
                            : order.status === "Shipped"
                            ? "bg-cyan-300 text-cyan-800"
                            : order.status === "Processing"
                            ? "bg-yellow-300 text-yellow-800"
                            : order.status === "Paid"
                            ? "bg-green-300 text-green-800"
                            : order.status === "pending"
                            ? "bg-gray-200 text-black-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status || "pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                        onClick={() => {
                          router.push(`/admin/orderlist/${order._id}`);
                        }}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                // Only show "No orders found" if not loading and no results
                <tr>
                  <td colSpan={6} className="p-3 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
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
