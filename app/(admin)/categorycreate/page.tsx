"use client";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function CategoryCreate() {
  const router = useRouter();
  const [categoryTitle, setCategoryTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleCreateCategory = () => {
    // Handle category creation logic here
    console.log("Category Created:", { categoryTitle, description, priceRange });
    router.push("/categorylist");
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar with Icons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Category Create</h1>

          {/* Top-Right Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button onClick={() => router.push("/notifications")} className="p-2">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button onClick={() => router.push("/settings")} className="p-2">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (e.g., Order History, Activity Log, etc.) */}
            <button onClick={() => router.push("/history")} className="p-2">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button onClick={() => router.push("../../profilepage")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Add Thumbnail Photo Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-3/4 ml-36 ">
          <h2 className="text-lg font-semibold mb-4">Add Thumbnail Photo</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-48 flex justify-center items-center">
            <p className="text-gray-500">Drop your image here,</p>
            <p className="text-gray-500">Jpeg, png are allowed</p>
          </div>
        </div>

        {/* General Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-md w-3/4 ml-36">
          <h2 className="text-lg font-semibold mb-4">General Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Title</label>
              <input
                type="text"
                value={categoryTitle}
                onChange={(e) => setCategoryTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price Range</label>
              <input
                type="text"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6 space-x-4 mr-40">
          <button
            onClick={() => router.push("/categorylist")}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-md hover:bg-gray-400"
          >
            CANCEL
          </button>
          <button
            onClick={handleCreateCategory}
            className="bg-orange-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-orange-600 "
          >
            CREATE CATEGORY
          </button>
        </div>
      </div>
    </div>
  );
}