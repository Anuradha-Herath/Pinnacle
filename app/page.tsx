"use client";

import React from "react";
import Header from "./components/Header";
import ProductCarousel from "./components/ProductCarousel";
import Footer from "./components/Footer";

const products = [
  {
    id: 1,
    name: "T-Shirt",
    price: 19.99,
    image: "/p1.webp",
    colors: ["#000000", "#FFFFFF", "#FF5733"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "Sneakers",
    price: 49.99,
    image: "/p2.webp",
    colors: ["#FF0000", "#00FF00", "#0000FF"],
    sizes: ["7", "8", "9", "10"],
  },
  {
    id: 3,
    name: "Jacket",
    price: 79.99,
    image: "/p3.webp",
    colors: ["#333333", "#555555", "#777777"],
    sizes: ["M", "L", "XL"],
  },
  {
    id: 4,
    name: "Hat",
    price: 14.99,
    image: "/p4.webp",
    colors: ["#F4A261", "#264653", "#E76F51"],
    sizes: ["One Size"],
  },
  {
    id: 5,
    name: "Jeans",
    price: 39.99,
    image: "/p5.webp",
    colors: ["#1E3A8A", "#4B5563", "#9CA3AF"],
    sizes: ["30", "32", "34", "36"],
  },
  {
    id: 6,
    name: "Watch",
    price: 59.99,
    image: "/p6.webp",
    colors: ["#000000", "#C0C0C0", "#8B0000"],
    sizes: ["One Size"],
  },
  {
    id: 7,
    name: "Backpack",
    price: 34.99,
    image: "/p7.webp",
    colors: ["#8D8741", "#659DBD", "#DAAD86"],
    sizes: ["One Size"],
  },
  {
    id: 8,
    name: "Sunglasses",
    price: 29.99,
    image: "/p8.webp",
    colors: ["#222222", "#444444", "#666666"],
    sizes: ["One Size"],
  },
  {
    id: 9,
    name: "Scarf",
    price: 19.99,
    image: "/p9.webp",
    colors: ["#D72638", "#3F88C5", "#F49D37"],
    sizes: ["One Size"],
  },
];

const HomePage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <div className="flex-grow">
        {/* Men's Collection */}
        <ProductCarousel title="Men's Collection" products={products} />

        {/* Large Shop Now Images */}
        <div className="flex gap-4 my-10 px-4 justify-center">
          {/* Shop Men */}
          <div className="relative w-[45%]">
            <img
              src="/shopmen.webp"
              alt="Shop Men"
              className="w-full h-[300px] object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
                Shop Men
              </button>
            </div>
          </div>

          {/* Shop Women */}
          <div className="relative w-[45%]">
            <img
              src="/shopwomen.webp"
              alt="Shop Women"
              className="w-full h-[300px] object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
                Shop Women
              </button>
            </div>
          </div>
        </div>

        {/* Large Accessories Banner */}
        <div className="relative w-full my-10 px-4 md:px-8 lg:px-12">
          <img
            src="/cap.jpg"
            alt="Accessories"
            className="w-full h-[250px] object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
              Shop Accessories
            </button>
          </div>
        </div>

        {/* Women's Collection */}
        <ProductCarousel title="Women's Collection" products={products} />

        {/* Accessories */}
        <ProductCarousel title="Accessories" products={products} />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
