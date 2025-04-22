"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, BellIcon, Cog6ToothIcon, ClockIcon, CheckCircleIcon, TruckIcon, CubeIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { CogIcon, ShoppingCartIcon } from "lucide-react";

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

  const [orders, setOrders] = useState<Order[]>([]);
  const [profilePicture, setProfilePicture] = useState<string>('/p9.webp');
  
  useEffect(() => {
    // Fetch orders from the API
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  },[]);

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

  const router = useRouter();

  // State for filtering orders by status
  const [filterStatus, setFilterStatus] = useState("");

  const filteredOrders = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : orders;

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
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (e.g., Order History, Activity Log, etc.) */}
            <button onClick={() => router.push("/history")} className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push("../../adminprofile")}
              className="p-1 rounded-full border-2 border-gray-300"
            >
              <img
                src={`${profilePicture}?t=${Date.now()}`}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
                onError={(e) => {
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
              <h2 className="text-lg font-semibold">Order Confirm & Processing</h2>
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
                {/* <th className="p-3">Delivery Number</th> */}
                <th className="p-3">Order Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? 
              (filteredOrders.map((order, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{order.orderNumber}</td>
                  <td className="p-3">{order.createdAt}</td>
                  <td className="p-3">{order.customer.firstName}</td>
                  <td className="p-3"><span className="text-orange-500">$</span> {order.totalPrice}</td>
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
                      onClick={() => {
                        console.log(`Navigating to admin order details: /admin/order-details/${order._id}`);
                        router.push(`/admin/order-details/${order._id}`);
                      }}
                      aria-label="View order details"
                      title="View order details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ): (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">No orders found</td>
              </tr>
            )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-end mt-6 pr-4">
            <div className="flex items-center border rounded-md overflow-hidden shadow-md">
              <button className="px-4 py-2 border-r bg-white hover:bg-gray-200">Previous</button>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">2</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}