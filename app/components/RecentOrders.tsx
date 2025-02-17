"use client";

import React from "react";
import { BsEyeFill } from "react-icons/bs";

const RecentOrders: React.FC = () => {
  const orders = [
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Robert Hue",
      items: 3,
      deliveryNumber: "#31212",
      orderStatus: "Order Confirmed",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Mari Cury",
      items: 1,
      deliveryNumber: "#121211",
      orderStatus: "Order Completed",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Anjalina Jolly",
      items: 4,
      deliveryNumber: "#1214",
      orderStatus: "Out For Delivery",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Brad Pitt",
      items: 1,
      deliveryNumber: "#11121",
      orderStatus: "Shipping",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Dammika Perera",
      items: 2,
      deliveryNumber: "#2121",
      orderStatus: "Order Completed",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Malinga",
      items: 1,
      deliveryNumber: "#12121",
      orderStatus: "Order Completed",
    },
    {
      orderId: "#538765",
      createdAt: "April 24, 2024",
      customer: "Kusal",
      items: 4,
      deliveryNumber: "#41212",
      orderStatus: "Processing",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Order Confirmed":
        return "bg-blue-200 text-blue-800";
      case "Order Completed":
        return "bg-green-200 text-green-800";
      case "Out For Delivery":
        return "bg-orange-200 text-orange-800";
      case "Shipping":
        return "bg-sky-200 text-sky-800";
      case "Processing":
        return "bg-yellow-200 text-yellow-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
          <select className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring focus:border-blue-300">
            <option>Order Status</option>
            <option>Order Confirmed</option>
            <option>Order Completed</option>
            <option>Out For Delivery</option>
            <option>Shipping</option>
            <option>Processing</option>
          </select>
        </div>
      </div>
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
            {orders.map((order, index) => (
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
            ))}
          </tbody>
        </table>
      </div>
    <div className="flex justify-center mt-6">
      <div className="border rounded-md flex items-center">
        <button className="px-4 py-2 text-sm border-r text-gray-600">
        Previous
        </button>
        <button className="px-4 py-2 text-sm bg-red-500 text-white">
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
    </div>
  );
};

export default RecentOrders;
