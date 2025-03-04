"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function DiscountList() {
  const router = useRouter();

  // Dummy discount data
  const [discounts] = useState([
    { id: "D001", product: "Men's T-Shirt", type: "Sub-Category", percentage: "50%", startDate: "12 May 2023", endDate: "12 Jun 2023", status: "Active" },
    { id: "D002", product: "Black Men T-Shirt", type: "Product", percentage: "25%", startDate: "12 May 2023", endDate: "12 Jun 2023", status: "Active" },
    { id: "D003", product: "Men", type: "Category", percentage: "25%", startDate: "12 May 2023", endDate: "12 Jun 2023", status: "Active" },
  ]);

  // Function to view discount details
  const handleViewDiscount = (discountId: string) => {
    router.push(`/discountview?id=${discountId}`);
  };

  // Function to edit discount 
  const handleEditDiscount = (discountId: string) => {
    router.push(`/discountedit?id=${discountId}`);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Discount List</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-lg"><BellIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><Cog6ToothIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><ClockIcon className="h-6 w-6 text-gray-600" /></button>
            <button onClick={() => router.push("/profile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
            <input type="text" placeholder="🔍 Search" className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        {/* Add Discount Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => router.push("/discountcreate")} 
            className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" /> Create a Discount
          </button>
        </div>

        {/* Discount Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-lg flex justify-between items-center">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Active Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">23</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg flex justify-between items-center">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Expired Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">12</p>
            </div>
          </div>
        </div>

        {/* Discount Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-gray-600 font-semibold">All Discount List</h2>
            <button className="px-4 py-2 border rounded-lg text-gray-600">This Month ▼</button>
          </div>
          <table className="w-full border-collapse text-gray-600">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-3">Product Name</th>
                <th className="p-3">Discount Type</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{discount.product}</td>
                  <td className="p-3">{discount.type}</td>
                  <td className="p-3">{discount.percentage}</td>
                  <td className="p-3">{discount.startDate}</td>
                  <td className="p-3">{discount.endDate}</td>
                  <td className="p-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${discount.status === "Active" ? "bg-green-300 text-green-800" : "bg-orange-300 text-orange-800"}`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 justify-end">
                    <button 
                      onClick={() => handleViewDiscount(discount.id)}
                      className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleEditDiscount(discount.id)}
                      className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
