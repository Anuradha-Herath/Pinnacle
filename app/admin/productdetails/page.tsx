"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";

export default function ProductDetails() {
  const router = useRouter();
  const productImages = [
    "p1.webp",
    "p2.webp",
    "p3.webp",
    "p4.webp",
  ];

  const productData = {
    productName: "Classic Seamless Henly Polo Tee",
    description:
      "The Classic Seamless Henley Polo Tee combines timeless style with modern comfort. Featuring a buttoned Henley neckline, this versatile tee is crafted from soft, seamless fabric for a sleek fit and all-day ease. Perfect for casual wear or layering, it offers a refined yet laid-back look suitable for any occasion.",
    category: "Mens",
    subCategory: "Tees",
    regularPrice: "110.40",
    sizes: [
      { size: "S", quantity: 197 },
      { size: "M", quantity: 263 },
      { size: "L", quantity: 281 },
      { size: "XL", quantity: 314 },
      { size: "2XL", quantity: 203 },
    ],
    colors: [
      { name: "Jet Black", quantity: 313 },
      { name: "Navy Blue", quantity: 500 },
      { name: "Charcoal", quantity: 199 },
      { name: "Olive Green", quantity: 257 },
    ],
    tags: ["featured", "new", "summer-collection"],
  };

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Details" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Product Details</span>
          </div>

          {/* Image Gallery */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            {/* Main Image */}
            <div className="col-span-2 h-96 rounded-lg overflow-hidden">
              <img
                src={productImages[0]}
                alt="Main product"
                className="w-50 h-100 object-cover"
              />
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-2 gap-4">
              {productImages.slice(1).map(
                (img, index) =>
                      <img
                        src={img}
                        alt={`Thumbnail ${index}`}
                        className="w-full h-full object-cover"
                      />
                  )
              }
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section */}
            <div className="space-y-6">
              {/* Product Name Section */}
              <div className="space-y-2">
                <span className="text-xl font-bold text-black">
                  Product Name
                </span>
                <h1 className="text-base">
                  {productData.productName}
                </h1>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <span className="text-xl font-bold text-black">
                  Description
                </span>
                <p className="text-black whitespace-pre-line">
                  {productData.description}
                </p>
              </div>

              {/* Product Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-black">Category</span>
                    <p className="font-medium">{productData.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-black">Sub Category</span>
                    <p className="font-medium">{productData.subCategory}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-xl font-bold text-black">Regular Price</span>
                    <p className="text-xl">
                      ${productData.regularPrice}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <span className="text-xl font-bold text-black">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {productData.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-black rounded-full text-sm text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="space-y-6">
              {/* Size Table */}
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Size
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productData.sizes.map((item) => (
                        <tr key={item.size}>
                          <td className="px-4 py-3 font-medium text-center">{item.size}</td>
                          <td className="px-4 py-3 text-center">
                            {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Color Table */}
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Color
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productData.colors.map((color) => (
                        <tr key={color.name}>
                          <td className="px-4 py-3 text-center">
                            {color.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {color.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button 
                  onClick={() => router.push('/admin/productedit/sample')}
                  className="px-20 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  EDIT
                </button>
                <button 
                  onClick={() => router.push('/admin/productlist')}
                  className="px-20 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  BACK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
