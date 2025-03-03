"use client";

import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";

export default function InventoryDetailsPage() {
  const router = useRouter();

  // Dummy product details
  const product = {
    name: "Classic Seamless Henly Polo Tee",
    id: "#12456",
    selectedSize: "M",
    selectedColor: "Red",
    stock: 101,
    stockLimit: 100,
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { name: "Red", image: "/p3.webp" },
      { name: "Blue", image: "/p4.webp" },
      { name: "Green", image: "/p1.webp" },
      { name: "Black", image: "/p5.webp" },
    ],
    sizeStock: {
      S: 197,
      M: 263,
      L: 281,
      XL: 314,
      "2XL": 203,
    },
    colorStock: {
      Red: 313,
      Blue: 500,
      Green: 199,
      Black: 257,
    },
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Inventory Details</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-lg">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>
            {/* Profile */}
            <button
              onClick={() => router.push("../../profilepage")}
              className="p-1 rounded-full border-2 border-gray-300"
            >
              <img
                src="/p9.webp"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Top Images */}
        <div className="grid grid-cols-2 m-8">
          <div>
            <img src="/p3.webp" className="w-3/5 rounded-lg shadow-lg" alt="Main Product" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="/p1.webp" className="w-3/5 rounded-lg shadow-lg" alt="Product Variant 1" />
            <img src="/p3.webp" className="w-3/5 rounded-lg shadow-lg" alt="Product Variant 2" />
            <img src="/p5.webp" className="w-3/5 rounded-lg shadow-lg" alt="Product Variant 3" />
            <img src="/p4.webp" className="w-3/5 rounded-lg shadow-lg" alt="Product Variant 4" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-3/5">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-gray-600">Product ID: {product.id}</p>

              {/* Size Selection */}
              <div className="mt-4">
                <p className="font-semibold">Size {'>'} {product.selectedSize}</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`p-2 border rounded-md text-center ${
                        size === product.selectedSize
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mt-4">
                <p className="font-semibold">Stock - {product.stock}</p>
                <p className="text-green-500">In Stock</p>
              </div>

              {/* Color Selection */}
              <div className="mt-4">
                <p className="font-semibold">Colors {'>'} {product.selectedColor}</p>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {product.colors.map((color) => (
                    <div
                      key={color.name}
                      className={`p-2 border rounded-md text-center ${
                        color.name === product.selectedColor
                          ? "border-orange-500"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Display the color image */}
                      <img
                        src={color.image} // Path to the color image
                        alt={color.name}
                        className="w-20 h-20 mx-auto rounded-lg object-cover"
                      />
                      <p className="mt-1 text-sm">{color.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Limit */}
              <div className="mt-4">
                <p className="font-semibold">Stock Limit: {product.stockLimit}</p>
              </div>

              {/* Edit Buttons */}
              <div className="mt-4 flex gap-4">
                <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
                  Edit Stock
                </button>
                <button className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400">
                  Edit Stock Unit
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-2/5">
            {/* Size-wise Stock Table */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Size-wise Stock</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3">Size</th>
                    <th className="p-3">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sizes.map((size) => (
                    <tr key={size} className="border-t">
                      <td className="p-3">{size}</td>
                      <td className="p-3">
                        {product.sizeStock[size as keyof typeof product.sizeStock]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Color-wise Stock Table */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Color-wise Stock</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 pr-16">Color</th>
                    <th className="py-2 pr-8 ">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(product.colorStock).map((color) => {
                    const colorData = product.colors.find((c) => c.name === color);
                    return (
                      <tr key={color} className="border-t">
                        <td className="p-3 pl-8 flex items-center gap-2">
                          {/* Display the color image */}
                          {colorData && (
                            <img
                              src={colorData.image} // Path to the color image
                              alt={color}
                              className="w-8 h-8 rounded-lg object-cover shadow-lg"
                            />
                          )}
                          <span>{color}</span>
                        </td>
                        <td className="p-3 pl-12">
                          {product.colorStock[color as keyof typeof product.colorStock]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push("../inventory")}
            className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 w-28"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}