"use client";

import React, { useState } from "react";

const products = [
  {
    id: 1,
    name: "Casual Shirt",
    price: "$29.99",
    category: "Shirts",
    size: "M",
    color: "Blue",
    inStock: true,
    image: "/shirt1.jpg",
  },
  {
    id: 2,
    name: "Formal Shirt",
    price: "$39.99",
    category: "Shirts",
    size: "L",
    color: "White",
    inStock: false,
    image: "/shirt2.jpg",
  },
  {
    id: 3,
    name: "Slim Fit Jeans",
    price: "$49.99",
    category: "Pants",
    size: "XL",
    color: "Black",
    inStock: true,
    image: "/pants1.jpg",
  },
  {
    id: 4,
    name: "Chinos",
    price: "$45.99",
    category: "Pants",
    size: "S",
    color: "Beige",
    inStock: true,
    image: "/pants2.jpg",
  },
  {
    id: 5,
    name: "Sneakers",
    price: "$59.99",
    category: "Shoes",
    size: "M",
    color: "Red",
    inStock: true,
    image: "/shoes1.jpg",
  },
  {
    id: 6,
    name: "Loafers",
    price: "$64.99",
    category: "Shoes",
    size: "L",
    color: "Brown",
    inStock: false,
    image: "/shoes2.jpg",
  },
];

const categories = ["All", "Shirts", "Pants", "Shoes"];
const sizes = ["All", "S", "M", "L", "XL", "XXL"];
const colors = ["All", "Black", "White", "Blue", "Red", "Beige", "Brown"];
const availability = ["All", "In Stock", "Out of Stock"];

const MensWearPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [selectedAvailability, setSelectedAvailability] = useState("All");

  // Filter logic
  const filteredProducts = products.filter((product) => {
    return (
      (selectedCategory === "All" || product.category === selectedCategory) &&
      (selectedSize === "All" || product.size === selectedSize) &&
      (selectedColor === "All" || product.color === selectedColor) &&
      (selectedAvailability === "All" ||
        (selectedAvailability === "In Stock"
          ? product.inStock
          : !product.inStock))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Men's Wear</h2>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Section (Left Side) */}
        <div className="md:col-span-1 bg-gray-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>

          {/* Category Filter */}
          <label className="block mb-2 font-medium">Category</label>
          <select
            className="w-full px-4 py-2 mb-4 border rounded-md bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Size Filter */}
          <label className="block mb-2 font-medium">Size</label>
          <select
            className="w-full px-4 py-2 mb-4 border rounded-md bg-white"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          {/* Color Filter */}
          <label className="block mb-2 font-medium">Color</label>
          <select
            className="w-full px-4 py-2 mb-4 border rounded-md bg-white"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          >
            {colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <label className="block mb-2 font-medium">Availability</label>
          <select
            className="w-full px-4 py-2 border rounded-md bg-white"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          >
            {availability.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Product Section (Right Side) */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow-lg"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-cover rounded-md mb-4"
                  />
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-600">{product.price}</p>
                  <p className="text-sm text-gray-500">
                    Size: {product.size} | Color: {product.color}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      product.inStock ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </p>
                  <button
                    className={`mt-3 px-4 py-2 rounded-md transition ${
                      product.inStock
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-400 text-gray-700 cursor-not-allowed"
                    }`}
                    disabled={!product.inStock}
                  >
                    Add to Cart
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No products match your filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MensWearPage;
