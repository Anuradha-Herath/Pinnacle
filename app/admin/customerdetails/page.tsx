"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { Crown } from "lucide-react";

// Define interfaces for type safety
interface CustomerData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

interface OrderData {
  _id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
}

export default function CustomerDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  
  // State for customer data
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // Fetch customer data when component mounts
  useEffect(() => {
    if (!customerId) {
      setError("No customer ID provided");
      setLoading(false);
      return;
    }

    const fetchCustomerDetails = async () => {
      try {
        // Fetch customer details
        const customerResponse = await fetch(`/api/users/${customerId}`);
        if (!customerResponse.ok) {
          throw new Error("Failed to fetch customer details");
        }
        const customerData = await customerResponse.json();
        setCustomer(customerData.user);

        // Fetch customer orders - using the new dedicated API endpoint
        const ordersResponse = await fetch(`/api/users/orders?userId=${customerId}`);
        if (!ordersResponse.ok) {
          throw new Error("Failed to fetch customer orders");
        }
        const ordersData = await ordersResponse.json();
        
        if (ordersData.success && ordersData.orders) {
          setOrders(ordersData.orders);
          setTotalOrders(ordersData.orders.length);
          
          // Calculate total spent
          const total = ordersData.orders.reduce(
            (sum: number, order: OrderData) => sum + (order.totalAmount || 0), 
            0
          );
          setTotalSpent(total);
        } else {
          setOrders([]);
          setTotalOrders(0);
          setTotalSpent(0);
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}th, ${year}`;
  };

  // Get customer name
  const getCustomerName = () => {
    if (!customer) return "Loading...";
    return `${customer.firstName} ${customer.lastName}`;
  };

  // Get customer type/role icon color
  const getCustomerTypeColor = () => {
    if (!customer) return "text-gray-400";
    
    if (customer.role === 'admin') return "text-black";
    if (customer.role === 'premium') return "text-orange-500";
    return "text-gray-400";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-2">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Customer not found"}</p>
            <button 
              onClick={() => router.push('/admin/customerlist')}
              className="px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Back to Customer List
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Customer Details</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/admin/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/admin/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/admin/history")} className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>
            {/* Profile */}
            <button onClick={() => router.push("/admin/adminprofile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            <div className="bg-orange-100 rounded-t-2xl p-8 flex justify-center relative">
              <Image src="/p3.webp" alt={getCustomerName()} width={80} height={80} className="rounded-full border-4 border-white" />
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                <Crown className={`w-6 h-6 ${getCustomerTypeColor()}`} />
              </div>
            </div>
            <div className="p-4 text-center">
              <h2 className="text-lg font-semibold">{getCustomerName()}</h2>
              <p className="text-sm text-gray-600">Email: {customer.email}</p>
              <p className="text-sm text-gray-600">Phone: {customer.phone || "Not provided"}</p>
            </div>
          </div>

          {/* Middle Column - Order Summary */}
          <div className="col-span-2 grid grid-cols-3 gap-6">
            <div className="bg-white p-2 rounded-lg shadow-lg text-center h-24 flex flex-col justify-center relative pl-4">
              <div className="absolute top-2 right-2">
                <span className="text-gray-400 top-1/2 right-10 transform -translate-y-1/2">...</span>
              </div>
              <p className="text-gray-600 text-left w-32">Total Orders</p>
              <h2 className="text-2xl font-bold text-left">{totalOrders}</h2>
              <span className="absolute top-1/2 right-2 transform -translate-y-1 text-3xl">📦</span>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-lg text-center h-24 flex flex-col justify-center relative pl-4">
              <div className="absolute top-2 right-2">
                <span className="text-gray-400 top-1/2 right-10 transform -translate-y-1/2">...</span>
              </div>
              <p className="text-gray-600 text-left w-32">Total Amount</p>
              <h2 className="text-2xl font-bold text-left">${totalSpent.toFixed(2)}</h2>
              <span className="absolute top-1/2 right-2 transform -translate-y-1 text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Customer & Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-md font-semibold mb-4">Customer Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-semibold">Customer Id:</span><br></br> #{customer._id.substring(0, 8)}</p>
              <p><span className="font-semibold">Delivery Address:</span><br></br> {customer.address || "No address provided"}</p>
              <p><span className="font-semibold">Latest Order Id:</span><br></br> {orders.length > 0 ? `#${orders[0]._id.substring(0, 8)}` : "No orders yet"}</p>
              <p><span className="font-semibold">Registration Date:</span><br></br> {formatDate(customer.createdAt)}</p>
              <p><span className="font-semibold">Last Login Date:</span><br></br> {customer.lastLogin ? formatDate(customer.lastLogin) : "Not available"}</p>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-lg self-start h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order._id} className="border-t">
                      <td className="p-3">#{order._id.substring(0, 8)}</td>
                      <td className="p-3">{formatDate(order.createdAt)}</td>
                      <td className="p-3">{order.status}</td>
                      <td className="p-3">${order.totalAmount?.toFixed(2) || "0.00"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No orders found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-end mt-6">
          <button 
            onClick={() => router.push('/admin/customerlist')}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Back to Customer List
          </button>
        </div>
      </div>
    </div>
  );
}
