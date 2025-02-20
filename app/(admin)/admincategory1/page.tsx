"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CategoryList() {
  const router = useRouter();
  
  // Dummy category data
  const [categories] = useState([
    { name: "Men/ T-Shirts", id: "343443", price: "LKR 2000-LKR5000", stock: 125, image: "/p9.webp" },
    { name: "Men/ Shirts", id: "343444", price: "LKR 2000-LKR5000", stock: 115, image: "/p9.webp" },
    { name: "Women/T-Shirts", id: "343445", price: "LKR 2000-LKR5000", stock: 135, image: "/women.webp" },
    { name: "Women/Tees", id: "343446", price: "LKR 2000-LKR5000", stock: 90, image: "/women.webp" },
    { name: "Accessories/Caps", id: "343447", price: "LKR 2000-LKR5000", stock: 75, image: "/cap1.webp" },
    { name: "Accessories/Water Bottles", id: "343448", price: "LKR 2000-LKR5000", stock: 50, image: "/cap1.webp" },
  ]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        
        {/* Top Bar with Icons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Category List</h1>

          {/* Top-Right Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button onClick={() => router.push("/notifications")} className="p-2 ">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button onClick={() => router.push("/settings")} className="p-2 ">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (e.g., Order History, Activity Log, etc.) */}
            <button onClick={() => router.push("/history")} className="p-2 ">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button onClick={() => router.push("../../profilepage")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Add Category Button */}
        <div className="flex justify-end mb-6">
          <a href="categorycreate"><button className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md">
            ➕ Add A New Category
          </button></a>
        </div>

{/* Category Cards */}
        <div className="grid grid-cols-3 gap-40 mb-8">
          
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <img src="p9.webp" alt="Men" className="h-40 w-20 object-cover" />
            <p className="mt-2 text-lg font-semibold">Men</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <img src="cap2.webp" alt="Accessories" className="h-40 w-20 object-cover" />
            <p className="mt-2 text-lg font-semibold">Accessories</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
            <img src="/women.webp" alt="Women" className="h-40 w-20 object-cover" />
            <p className="mt-2 text-lg font-semibold">Women</p>
          </div>
        </div>

        {/* Category Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Category List</h2>
            <input
              type="text"
              placeholder="🔍 Search"
              className="border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">All Categories</th>
                <th className="p-3 pl-6">ID</th>
                <th className="p-3 pl-20">Price Range</th>
                <th className="p-3 pl-2">Stock</th>
                <th className="p-5 text-right pr-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3 flex items-center gap-3">
                    <img src={category.image} alt={category.name} className="h-10 w-10 rounded-md object-cover" />
                    {category.name}
                  </td>
                  <td className="p-3 pr-16">{category.id}</td>
                  <td className="p-3 pr-16 pl-16">{category.price}</td>
                  <td className="p-3 pr-20">{category.stock}</td>
                  <td className="p-3 flex gap-2 ">
                    
                    {/* View (Eye) Button */}
                    <button
                      className="p-2  bg-orange-500 text-white rounded-md shadow-md"
                      onClick={() => router.push(`/categories/view/${category.id}`)}
                    >
                      <EyeIcon className="h-5 w-5 " />
                    </button>

                    {/* Edit (Pencil) Button */}
                    <button
                      className="p-2 bg-orange-500 text-white rounded-md shadow-md"
                      onClick={() => router.push(`/categories/edit/${category.id}`)}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    {/* Delete (Trash) Button */}
                    <button
                      className="p-2 bg-orange-500 text-white rounded-md shadow-md"
                      onClick={() => router.push(`/categories/delete/${category.id}`)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
