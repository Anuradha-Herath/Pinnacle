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
    colors: ["/p1.webp", "/p1.webp", "/p1.webp"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "Sneakers",
    price: 49.99,
    image: "/p2.webp",
    colors: ["/p2-white.webp", "/p2-black.webp", "/p2-gray.webp"],
    sizes: ["6", "7", "8", "9", "10"],
  },
  {
    id: 3,
    name: "Jacket",
    price: 79.99,
    image: "/p3.webp",
    colors: ["/p3-brown.webp", "/p3-gray.webp", "/p3-black.webp"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 4,
    name: "Hat",
    price: 14.99,
    image: "/p4.webp",
    colors: ["/p4-red.webp", "/p4-blue.webp", "/p4-black.webp"],
    sizes: ["One Size"],
  },
  {
    id: 5,
    name: "Jeans",
    price: 39.99,
    image: "/p5.webp",
    colors: ["/p5-darkblue.webp", "/p5-lightblue.webp"],
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    id: 6,
    name: "Watch",
    price: 59.99,
    image: "/p6.webp",
    colors: ["/p6-black.webp", "/p6-gold.webp", "/p6-silver.webp"],
    sizes: ["One Size"],
  },
  {
    id: 7,
    name: "Backpack",
    price: 34.99,
    image: "/p7.webp",
    colors: ["/p7-black.webp", "/p7-gray.webp", "/p7-navy.webp"],
    sizes: ["One Size"],
  },
  {
    id: 8,
    name: "Sunglasses",
    price: 29.99,
    image: "/p8.webp",
    colors: ["/p8-black.webp", "/p8-brown.webp", "/p8-blue.webp"],
    sizes: ["One Size"],
  },
  {
    id: 9,
    name: "Scarf",
    price: 19.99,
    image: "/p9.webp",
    colors: ["/p9-red.webp", "/p9-gray.webp", "/p9-black.webp"],
    sizes: ["One Size"],
  },
];


const HomePage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      {/* Banner */}
      <div className="banner">
        <img src="/banner2.jpg" alt="Banner" className="w-full h-auto" />
      </div>

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
