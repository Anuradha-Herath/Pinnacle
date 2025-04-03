"use client";

import { useRouter } from "next/navigation";
import {
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

export default function CategoryEdit() {
  const router = useRouter();

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar with Icons and Search Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Category Edit</h1>

          {/* Icons + Search Bar + Profile */}
          <div className="flex items-center gap-2">
            

            {/* Notifications */}
            <button onClick={() => router.push("/notifications")} className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (History) */}
            <button onClick={() => router.push("/history")} className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push("../../profilepage")}
              className="p-1 rounded-full border-2 border-gray-300 hover:shadow-lg"
            >
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="../admincategory1" className="text-gray-600 font-semibold hover:text-orange-500">
            Category
          </Link>{" "}
          &gt;{" "}
          <span className="text-gray-600 font-semibold">Men</span>{" "}
          &gt;{" "}
          <span className="text-gray-600 font-semibold">T-Shirts</span>{" "}
          &gt;{" "}
          <span className="text-orange-500 font-semibold">Edit</span>
        </div>

        {/* Image & Product Gallery */}
        <div className="grid grid-cols-2 gap-6">
          {/* Category Image */}
          <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center">
            <img src="/shopmen.webp" alt="Men’s T-Shirts" className="h-72 w-full object-cover rounded-md" />
          </div>

          {/* Product Gallery Upload */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center border-dashed border-2 border-gray-300">
            <div className="text-center">
            <PhotoIcon className="h-10 w-10 text-gray-400 mb-2 text-orange-500 ml-14" />
              <p className="text-gray-500">Drop your image here,</p>
              <p className="text-gray-500">Jpeg, png are allowed</p>
              <button className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                ADD
              </button>
            </div>
          </div>
        </div>

        {/* Form for Editing Category */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Category Title */}
            <div>
              <label className="text-gray-600 font-semibold">Category Title</label>
              <input
                type="text"
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue="T-Shirts"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="text-gray-600 font-semibold">Price Range</label>
              <input
                type="text"
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue="$20.00 to $100"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="text-gray-600 font-semibold">Description</label>
              <textarea
                rows={3}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter category description..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-6 gap-4">
            <button className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
              UPDATE
            </button>
            <button className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
              DELETE
            </button>
            <button className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
