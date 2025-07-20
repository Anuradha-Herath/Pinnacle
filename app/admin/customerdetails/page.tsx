"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { getCustomerType } from "@/utils/loyaltyPoints";
import { getUserPoints } from "@/utils/modelAdapters";

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  amount: {
    total: number;
  };
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  profilePicture: string;
  role: string;
  points?: number | null; // Optional points field
}

export default function CustomerDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  useEffect(() => {
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }
    
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data for ID:", userId);
        
        // Fetch user details
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`);
        }
        const userData = await userResponse.json();
        
        if (!userData.success) {
          throw new Error(userData.error || 'Failed to fetch user data');
        }
        
        console.log("User data received:", userData.user);
        setUser(userData.user);
        
        // Fetch user orders
        const ordersResponse = await fetch(`/api/users/orders/${userId}`);
        if (!ordersResponse.ok) {
          throw new Error(`Failed to fetch user orders: ${ordersResponse.status} ${ordersResponse.statusText}`);
        }
        const ordersData = await ordersResponse.json();
        
        if (!ordersData.success) {
          throw new Error(ordersData.error || 'Failed to fetch user orders');
        }
        
        console.log("Orders data received:", ordersData);
        setOrders(ordersData.orders);
        setTotalOrders(ordersData.totalOrders);
        setTotalAmount(ordersData.totalAmount);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.push("/admin/customerlist")} 
              className="mr-4 flex items-center text-gray-600 hover:text-orange-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to List
            </button>
            <h1 className="text-2xl font-semibold">Customer Details</h1>
          </div>
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

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-red-500 bg-red-50 p-6 rounded-lg max-w-md">
              <p className="font-semibold text-lg mb-2">Error Loading Customer Details</p>
              <p className="mb-4">{error}</p>
              <p className="text-sm text-gray-700 mb-4">
                This might be due to one of the following reasons:
                <ul className="list-disc ml-5 mt-2">
                  <li>The customer ID is invalid</li>
                  <li>Database connection issues</li>
                  <li>The customer data no longer exists</li>
                </ul>
              </p>
              <button 
                onClick={() => router.push("/admin/customerlist")} 
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Return to Customer List
              </button>
            </div>
          </div>
        ) : user ? (
          <>
            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 relative">
                <div className="bg-orange-100 rounded-t-2xl p-8 flex justify-center relative">
                  <Image 
                    src={user.profilePicture || "/p3.webp"} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    width={80} 
                    height={80} 
                    className="rounded-full border-4 border-white" 
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                    <Crown className={`w-6 h-6 ${user.role === 'admin' ? 'text-orange-500' : getCustomerType(getUserPoints(user)).color}`} />
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h2 className="text-lg font-semibold">{`${user.firstName} ${user.lastName}`}</h2>
                  <p className="text-sm text-gray-600">Email: {user.email}</p>
                  <p className="text-sm text-gray-600">Phone: {user.phone || 'N/A'}</p>
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
                  <h2 className="text-2xl font-bold text-left">${totalAmount.toFixed(2)}</h2>
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
                  <p><span className="font-semibold">Customer Id:</span><br></br> #{user._id.substring(0, 5)}</p>
                  <p><span className="font-semibold">Delivery Address:</span><br></br> {user.address || 'Not provided'}</p>
                  <p><span className="font-semibold">Latest Order Id:</span><br></br> {orders.length > 0 ? `#${orders[0].orderNumber}` : 'No orders'}</p>
                  <p>
                    <span className="font-semibold">Customer Type:</span><br></br> 
                    <span className="flex items-center">
                      {getCustomerType(getUserPoints(user)).type} 
                      <Crown className={`w-4 h-4 ml-1 ${getCustomerType(getUserPoints(user)).color}`} />
                    </span>
                  </p>
                  <p><span className="font-semibold">Loyalty Points:</span><br></br> {getUserPoints(user)}</p>
                  <p><span className="font-semibold">Registration Date:</span><br></br> {formatDate(user.createdAt)}</p>
                  <p><span className="font-semibold">Last Login Date:</span><br></br> {formatDate(new Date().toISOString())}</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="col-span-2 bg-white p-6 rounded-lg shadow-lg self-start h-96 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
                {orders.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    No orders found for this customer
                  </div>
                ) : (
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
                      {orders.map((order) => (
                        <tr key={order._id} className="border-t">
                          <td className="p-3">{order.orderNumber}</td>
                          <td className="p-3">{formatDate(order.createdAt)}</td>
                          <td className="p-3">{order.status}</td>
                          <td className="p-3">${order.amount.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">No user data found</div>
          </div>
        )}
      </div>
    </div>
  );
}
