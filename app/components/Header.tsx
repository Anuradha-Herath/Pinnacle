"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "lucide-react";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  let timeout: NodeJS.Timeout;

  // Show dropdown when hovering
  const handleMouseEnter = (menu: string) => {
    clearTimeout(timeout); // Prevents immediate closing
    setOpenDropdown(menu);
  };

  // Hide dropdown with a slight delay
  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 200); // Delay of 200ms to allow smooth transition
  };

  return (
    <header className="bg-black text-white">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl italic font-serif">
            Pinnacle
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products or brands"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-800 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Right Icons */}
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
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex space-x-8 py-3">
            {/* Mens Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => handleMouseEnter("mens")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center hover:text-gray-300">
                Mens
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {openDropdown === "mens" && (
                <ul
                  className="absolute left-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg"
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  <li>
                    <Link
                      href="/mens/shirts"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Shirts
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/mens/pants"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Pants
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/mens/shoes"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Shoes
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Women Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => handleMouseEnter("women")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center hover:text-gray-300">
                Women
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {openDropdown === "women" && (
                <ul
                  className="absolute left-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg"
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  <li>
                    <Link
                      href="/women/dresses"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Dresses
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/women/tops"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Tops
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/women/shoes"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Shoes
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Accessories Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => handleMouseEnter("accessories")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center hover:text-gray-300">
                Accessories
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {openDropdown === "accessories" && (
                <ul
                  className="absolute left-0 mt-2 w-48 bg-white text-black shadow-lg rounded-lg"
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  <li>
                    <Link
                      href="/accessories/hats"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Hats
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/accessories/bags"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Bags
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/accessories/jewelry"
                      className="block px-4 py-2 hover:bg-gray-200"
                    >
                      Jewelry
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* Banner */}
      <div className="banner">
        <img src="/banner2.jpg" alt="Banner" className="w-full h-auto" />
      </div>
    </header>
  );
};

export default Header;
