"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponsList() {
  const router = useRouter();

  // Dummy coupon data
  const [coupons] = useState([
    { id: "C001", product: "T-Shirt", price: "$25.00", discount: "20%", code: "SAVE20", startDate: "12 May 2024", endDate: "12 June 2024", status: "Active" },
    { id: "C002", product: "Jeans", price: "$40.00", discount: "15%", code: "DENIM15", startDate: "10 May 2024", endDate: "10 June 2024", status: "Active" },
    { id: "C003", product: "Sneakers", price: "$60.00", discount: "10%", code: "SHOES10", startDate: "5 May 2024", endDate: "5 June 2024", status: "Expired" },
  ]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Coupons List</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-lg"><BellIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><Cog6ToothIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><ClockIcon className="h-6 w-6 text-gray-600" /></button>
            <button onClick={() => router.push("/profile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
            <input
              type="text"
              placeholder="🔍 Search"
              className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        {/* Add Coupon Button */}
        <div className="flex justify-end mb-6">
          <button className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600">
            <PlusIcon className="h-5 w-5" /> Create a Coupon
          </button>
        </div>

        {/* Coupon Stats */}
        <div className="grid grid-cols-2 gap-1 mb-6 justify-center">
          {/* Active Coupons */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between w-1/2 mx-auto">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Active Coupons</p>
              <p className="text-gray-900 text-2xl font-bold">23</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-xl">
              <img src="/active coupon.png" alt="Active Coupons" className="h-10 w-10" />
            </div>
          </div>

          {/* Expired Coupons */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between w-1/2 mx-auto">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Expired Coupons</p>
              <p className="text-gray-900 text-2xl font-bold">12</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-xl">
              <img src="/expired coupon.png" alt="Expired Coupons" className="h-10 w-10" />
            </div>
          </div>
        </div>
{/*}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">Active Coupons</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">Expired Coupons</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </div>*/}
        

        

        {/* Coupon Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-gray-600 font-semibold">All Customer List</h2>
            <button className="px-4 py-2 border rounded-lg text-gray-600">This Month ▼</button>
          </div>
          <table className="w-full border-collapse text-gray-600">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-3">Product Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Code</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3 ">Status</th>
                <th className="p-3 text-right pr-10">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">{coupon.product}</td>
                  <td className="p-3">{coupon.price}</td>
                  <td className="p-3">{coupon.discount}</td>
                  <td className="p-3">{coupon.code}</td>
                  <td className="p-3">{coupon.startDate}</td>
                  <td className="p-3">{coupon.endDate}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center align-middle ${
                          coupon.status === "Future"
                            ? "bg-blue-300 text-blue-800"
                            : coupon.status === "Active"
                            ? "bg-green-300 text-green-800"
                            : coupon.status === "Expired"
                            ? "bg-orange-300 text-orange-800"
                            : ""
                        }`}
                      >
                        {coupon.status}
                      </span>
                    </td>
                  {/*<td className="p-3 text-green-500 font-semibold">{coupon.status}</td>*/}
                    <td className="p-3 flex gap-2 justify-end">
                    <button className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600">
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
              <a href="/previouspage"><button className="px-4 py-2 border-r bg-white hover:bg-gray-200">Previous</button></a>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">2</button>
              <a href="/nextpage"><button className="px-4 py-2 border-l bg-white hover:bg-gray-200">Next</button></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
