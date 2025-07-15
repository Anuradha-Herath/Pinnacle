"use client";

import React, { useState, useEffect } from "react";
import { BsEyeFill } from "react-icons/bs";
import { getRecentOrders, RecentOrder } from "@/app/api/dashboard/route";

const RecentOrders: React.FC = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchRecentOrders() {
      try {
        setLoading(true);
        const recentOrders = await getRecentOrders(7); // Fetch 7 recent orders
        setOrders(recentOrders);
        setError(null);
      } catch (err) {
        console.error("Error fetching recent orders:", err);
        setError("Failed to load recent orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecentOrders();
  }, []);

  // Filter orders based on search term and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "" || 
      order.orderStatus === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Order Confirmed":
      case "Paid":
        return "bg-blue-200 text-blue-800";
      case "Order Completed":
      case "Delivered":
        return "bg-green-200 text-green-800";
      case "Out For Delivery":
        return "bg-orange-200 text-orange-800";
      case "Shipping":
      case "Shipped":
        return "bg-sky-200 text-sky-800";
      case "Processing":
        return "bg-yellow-200 text-yellow-800";
      case "pending":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <div className="flex items-center space-x-2">
          
          <select 
            className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Paid">Order Confirmed</option>
            <option value="Delivered">Order Completed</option>
            <option value="Out For Delivery">Out For Delivery</option>
            <option value="Shipped">Shipping</option>
            <option value="Processing">Processing</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.deliveryNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-gray-500 hover:text-gray-700">
                          <BsEyeFill />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No orders found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length > 0 && (
            <div className="flex justify-center mt-6">
              <div className="border rounded-md flex items-center">
                <button className="px-4 py-2 text-sm border-r text-gray-600">
                  Previous
                </button>
                <button className="px-4 py-2 text-sm bg-orange-500 text-white">
                  1
                </button>
                <button className="px-4 py-2 text-sm border-l text-gray-600">
                  2
                </button>
                <button className="px-4 py-2 text-sm border-l text-gray-600">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentOrders;
