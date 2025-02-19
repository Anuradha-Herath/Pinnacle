"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "react-feather";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

const products = [
  {
    id: 1,
    name: "Lykon Tee",
    price: 4200,
    image: "/p8.webp",
    colors: ["/p2.webp", "/p3.webp", "/p4.webp", "/p5.webp", "/p7.webp"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 2,
    name: "Lykon Tee",
    price: "Rs. 4,200.00",
    image: "/p5.webp",
    colors: ["/p6.webp", "/p7.webp", "/p8.webp"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 3,
    name: "Lykon Tee",
    price: "Rs. 4,200.00",
    image: "/p3.webp",
    colors: ["/p4.webp", "/p5.webp", "/p6.webp"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
];

const WishlistPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  return (
    <div>
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-2xl italic font-serif">
            Pinnacle
          </Link>
          <div className="relative flex-1 max-w-2xl mx-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products or brands"
              value={searchQuery}
              onChange={(e) => {
                if (e.target.value.trim() !== "") {
                  setSearchQuery(e.target.value);
                }
              }}
              className="w-full px-4 py-2 pl-10 bg-gray-800 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center cursor-pointer hover:text-gray-300">
              <User className="h-6 w-6" />
              <span className="ml-2">Sign in</span>
            </div>
            <button className="hover:text-gray-300">
              <Heart className="h-6 w-6" />
            </button>
            <button className="hover:text-gray-300">
              <ShoppingBag className="h-6 w-6" />
            </button>
          </div>
        </div>
        <nav className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex space-x-8 py-3">i
              {["mens", "women", "accessories"].map((category) => (
                <li
                  key={category}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(category)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex items-center hover:text-gray-300">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {openDropdown === category && (
                    <ul
                      className="absolute left-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg"
                      onMouseEnter={() => clearTimeout(timeoutRef.current!)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {category === "mens" &&
                        ["Shirts", "Pants", "Shoes"].map((item) => (
                          <li key={item}>
                            <Link
                              href={`/mens/${item.toLowerCase()}`}
                              className="block px-4 py-2 hover:bg-gray-200"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      {category === "women" &&
                        ["Dresses", "Tops", "Shoes"].map((item) => (
                          <li key={item}>
                            <Link
                              href={`/women/${item.toLowerCase()}`}
                              className="block px-4 py-2 hover:bg-gray-200"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      {category === "accessories" &&
                        ["Hats", "Bags", "Jewelry"].map((item) => (
                          <li key={item}>
                            <Link
                              href={`/accessories/${item.toLowerCase()}`}
                              className="block px-4 py-2 hover:bg-gray-200"
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
        <h2 className="text-medium mb-3">Recently added</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              hideWishlist={true}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WishlistPage;
