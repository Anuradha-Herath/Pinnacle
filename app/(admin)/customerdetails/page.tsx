"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { Crown } from "lucide-react";

export default function CustomerDetails() {
  const router = useRouter();

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Customer Details</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={() => router.push("/history")} className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>
            {/* Profile */}
            <button onClick={() => router.push("../../profilepage")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 relative">
            <div className="bg-orange-100 rounded-t-2xl p-8 flex justify-center relative">
              <Image src="/p3.webp" alt="Micheal Scofield" width={80} height={80} className="rounded-full border-4 border-white" />
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
              <Crown className="text-orange-500 w-6 h-6" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h2 className="text-lg font-semibold">Micheal Scofield</h2>
              <p className="text-sm text-gray-600">Email: Micheal369@gmail.com</p>
              <p className="text-sm text-gray-600">Phone: +94773445698</p>
            </div>
          </div>

          {/* Middle Column - Order Summary */}
            <div className="col-span-2 grid grid-cols-3 gap-6">
                    <div className="bg-white p-2 rounded-lg shadow-lg text-center h-24 flex flex-col justify-center relative pl-4">
                      <div className="absolute top-2 right-2">
                        <span className="text-gray-400 top-1/2 right-10 transform -translate-y-1/2">...</span>
                      </div>
                      <p className="text-gray-600 text-left w-32">Total Orders</p>
                      <h2 className="text-2xl font-bold text-left">523</h2>
                        <span className="absolute top-1/2 right-2 transform -translate-y-1 text-3xl">📦</span>
                    </div>
                <div className="bg-white p-2 rounded-lg shadow-lg text-center h-24 flex flex-col justify-center relative pl-4">
                <div className="absolute top-2 right-2">
                  <span className="text-gray-400 top-1/2 right-10 transform -translate-y-1/2">...</span>
                </div>
                <p className="text-gray-600 text-left w-32">Total Amount</p>
                <h2 className="text-2xl font-bold text-left">$10,230</h2>
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
              <p><span className="font-semibold">Customer Id:</span><br></br> #10101</p>
              <p><span className="font-semibold">Delivery Address:</span><br></br> 22/B Rosmead Place, Colombo 07</p>
              <p><span className="font-semibold">Latest Order Id:</span><br></br> #25426</p>
              <p><span className="font-semibold">Registration Date:</span><br></br> Jun 28th, 2022</p>
              <p><span className="font-semibold">Last Login Date:</span><br></br> Nov 10th, 2024</p>
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
                  {[{ id: "#25426", date: "Nov 8th, 2024", status: "Order Confirmed", amount: "$200.00" },
                    { id: "#25425", date: "Nov 7th, 2024", status: "Processed", amount: "$240.00" },
                    { id: "#25424", date: "Nov 6th, 2024", status: "Out for Delivery", amount: "$150.00" },
                    { id: "#25423", date: "Nov 5th, 2024", status: "Delivered", amount: "$130.00" }]
                    .map((order, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{order.id}</td>
                      <td className="p-3">{order.date}</td>
                      <td className="p-3">{order.status}</td>
                      <td className="p-3">{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-6">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border bg-white hover:bg-gray-200">Previous</button>
            <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
            <button className="px-4 py-2 border bg-white hover:bg-gray-200">2</button>
            <button className="px-4 py-2 border bg-white hover:bg-gray-200">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
