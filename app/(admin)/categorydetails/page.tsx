"use client";

import { useRouter } from "next/navigation";
import {
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

export default function CategoryDetails() {
  const router = useRouter();

  const products = [
    { name: "Henly Tee", price: "$110.40", image: "/p1.webp" },
    { name: "Universal Tee", price: "$110.40", image: "/p2.webp" },
    { name: "Polo Tee", price: "$110.40", image: "/p3.webp" },
    { name: "Classic Tee", price: "$110.40", image: "/p4.webp" },
    { name: "Lorem Tee", price: "$110.40", image: "/p5.webp" },
    { name: "Fit Tee", price: "$110.40", image: "/p6.webp" },
    { name: "Ipsum Tee", price: "$110.40", image: "/p7.webp" },
    { name: "Lava Tee", price: "$110.40", image: "/p8.webp" },
    { name: "Heri Tee", price: "$110.40", image: "/p9.webp" },
    { name: "Lorem Ipsum", price: "$110.40", image: "/p1.webp" },
    { name: "Blake Tee", price: "$110.40", image: "/p2.webp" },
    { name: "Lorem Ipsum", price: "$110.40", image: "/p3.webp" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar with Icons and Search Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Category Details</h1>

          {/* Icons + Search Bar + Profile */}
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded-md py-1 pl-8 pr-3 w-48 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-2 top-2" />
            </div>

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

        {/* Breadcrumb / Page Path with Links */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="../admincategory1" className="text-gray-600 font-semibold hover:text-orange-500">
            Category
          </Link>
          &gt;
          <span className="text-gray-600 font-semibold">Men</span>
          &gt;
          <span className="text-gray-600 font-semibold">T-Shirts</span>
          &gt;
          <span className="text-orange-500 font-semibold">Details</span>
        </div>

        <div className="grid grid-cols-2 gap-6 h-80">
          {/* CATEGORY INFO BOX */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-semibold">FASHION123</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 pl-16">Sub Category</p>
                <p className="font-semibold pl-16">T-Shirt</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-semibold">Men</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 pl-16">Stock</p>
                <p className="font-semibold pl-16">2330</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Starting Price</p>
                <p className="font-semibold">$20.00 to $100</p>
              </div>
            </div>
            <div className="mt-4">
              <a href="../categoryedit">
                <button className="bg-orange-500 text-white w-1/4 py-2 rounded-md hover:bg-orange-600">
                  EDIT
                </button>
              </a>
            </div>
          </div>

          {/* CATEGORY IMAGE */}
          <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center">
            <img src="/shopmen.webp" alt="Men’s T-Shirts" className="h-72 w-full object-cover rounded-md" />
          </div>
        </div>

        {/* PRODUCT GRID */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md relative">
                <img src={product.image} alt={product.name} className="h-36 w-3/4 object-cover rounded-md" />
                <p className="mt-2 text-sm font-semibold">{product.name}</p>
                <p className="text-gray-500 text-sm">{product.price}</p>

                {/* ACTION BUTTONS (View, Edit, Delete) */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    className="p-1 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600 hover:shadow-lg"
                    onClick={() => router.push(`/products/view/${index}`)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600 hover:shadow-lg"
                    onClick={() => router.push(`/products/edit/${index}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600 hover:shadow-lg">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW ALL BUTTON */}
          <div className="flex justify-end mt-6">
            <button className="bg-orange-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-orange-600 hover:shadow-lg">
              VIEW ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
