"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import DashboardHeader from "../../components/DashboardHeader";
import StatsCard from "../../components/StatsCard";
import SaleGraph from "../../components/SaleGraph";
import BestSellingItems from "../../components/BestSellingItems";
import RecentOrders from "../../components/RecentOrders";

// Define the Order interface
interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  totalPrice: number;
  status: string;
  createdAt: string;
}

const DashboardPage: React.FC = () => {
  // State for recent orders
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  
  // Fetch recent orders on component mount
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch('/api/orders?limit=5');
        if (response.ok) {
          const data = await response.json();
          setRecentOrders(data);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      }
    };
    
    fetchRecentOrders();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag"
            />
            <StatsCard
              title="Active Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag"
            />
            <StatsCard
              title="Completed Orders"
              value="$126.500"
              percentage="34.7%"
              iconType="bag"
            />
            <StatsCard
              title="Total Customers"
              value="1013"
              percentage="34.7%"
              iconType="person"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SaleGraph />
            <BestSellingItems />
          </div>
          
          {/* Recent Orders Table */}
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  {recentOrders.map((order: Order) => (
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{order.orderNumber || order._id.substring(0, 8)}</td>
                      <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">{`${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`}</td>
                      <td className="px-4 py-3">
                        Rs. {order.totalPrice?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
