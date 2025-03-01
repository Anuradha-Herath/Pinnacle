"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const Header = () => {
  const { wishlist } = useWishlist();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  let timeout: NodeJS.Timeout;
  const dropdownRef = useRef(null);

  const handleMouseEnter = (menu: string) => {
    clearTimeout(timeout);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  const dropdownData = {
    mens: {
      Clothing: {
        items: [
          "Tees",
          "Tanks",
          "Jackets",
          "Shirts",
          "Jeans",
          "Pants",
          "Shorts",
          "Joggers",
          "Compression",
          "Boxers",
        ],
        image: "/images/mens-clothing.jpg",
      },
      Footwear: {
        items: ["Shoes", "Sliders", "Flip Flops"],
        image: "/images/mens-footwear.jpg",
      },
      Accessories: {
        items: ["Hats", "Caps", "Socks"],
        image: "/images/mens-accessories.jpg",
      },
      rightImage: "/p1.webp", // Large right image for Mens dropdown
    },
    womens: {
      Clothing: {
        items: [
          "Tees",
          "Tanks",
          "Jackets",
          "Shirts",
          "Jeans",
          "Pants",
          "Shorts",
          "Joggers",
          "Compression",
          "Boxers",
          "Dresses",
          "Skirts",
          "Leggings",
        ],
        image: "/images/womens-clothing.jpg",
      },
      Footwear: {
        items: ["Shoes", "Sliders", "Flip Flops", "Heels", "Boots", "Sandals"],
        image: "/images/womens-footwear.jpg",
      },
      Accessories: {
        items: [
          "Hats",
          "Caps",
          "Socks",
          "Scarves",
          "Gloves",
          "Belts",
          "Jewelry",
        ],
        image: "/images/womens-accessories.jpg",
      },
      rightImage: "/images/womens-right-image.jpg", // Large right image for Womens dropdown
    },
    accessories: {
      Accessories: {
        items: [
          "Hats",
          "Caps",
          "Socks",
          "Bags",
          "Jewelry",
          "Watches",
          "Sunglasses",
          "Wallets",
        ],
        image: "/images/accessories-main.jpg",
      },
      rightImage: "/images/accessories-right-image.jpg", // Large right image for Accessories dropdown
    },
  };

  // Remove 'Collections' from dropdownData
  delete dropdownData.mens.Collections;
  delete dropdownData.womens.Collections;

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        openDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [openDropdown]);

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
            <Link href="/wishlist" className="hover:text-gray-300 relative">
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="hover:text-gray-300 relative">
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-800">
        <div className="mx-auto px-4 w-full">
          {" "}
          {/* Make nav container full width */}
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
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4  w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2" // Full screen width, 2 columns
                  style={{ left: 0, width: "100vw" }} // Ensure full viewport width
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Left side - Categories and Items */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {Object.entries(dropdownData.mens)
                      .filter(([key]) => key !== "rightImage")
                      .map(
                        (
                          [category, categoryData] // Filter out rightImage and now Collections is gone automatically
                        ) => (
                          <div key={category}>
                            <div className="flex items-center mb-2">
                              {categoryData.image && (
                                <img
                                  src={categoryData.image}
                                  alt={category}
                                  className="w-8 h-8 mr-2 rounded-md"
                                />
                              )}
                              <h3 className="font-semibold">{category}</h3>
                            </div>
                            <ul className="space-y-2">
                              {categoryData.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`/mens/${category.toLowerCase()}/${item
                                      .toLowerCase()
                                      .replace(/ /g, "-")}`}
                                    className="block px-4 py-1 hover:bg-gray-200 rounded-md"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    <div className="col-span-3 border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/mens"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Mens
                      </Link>
                    </div>
                  </div>

                  {/* Right side - Smaller Image with fixed max-height */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {" "}
                    {/* Center image */}
                    {dropdownData.mens.rightImage && (
                      <img
                        src={dropdownData.mens.rightImage}
                        alt="Mens Collection"
                        className="max-h-[450px] w-auto rounded-md object-contain" // **Fixed max-h in pixels, object-contain**
                      />
                    )}
                  </div>
                </div>
              )}
            </li>

            {/* Womens Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => handleMouseEnter("womens")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="flex items-center hover:text-gray-300">
                Womens
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {openDropdown === "womens" && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4  w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2" // Full screen width, 2 columns
                  style={{ left: 0, width: "100vw" }} // Ensure full viewport width
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Left side - Categories and Items */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {Object.entries(dropdownData.womens)
                      .filter(([key]) => key !== "rightImage")
                      .map(
                        (
                          [category, categoryData] // Filter out rightImage, Collections gone
                        ) => (
                          <div key={category}>
                            <div className="flex items-center mb-2">
                              {categoryData.image && (
                                <img
                                  src={categoryData.image}
                                  alt={category}
                                  className="w-8 h-8 mr-2 rounded-md"
                                />
                              )}
                              <h3 className="font-semibold">{category}</h3>
                            </div>
                            <ul className="space-y-2">
                              {categoryData.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`/womens/${category.toLowerCase()}/${item
                                      .toLowerCase()
                                      .replace(/ /g, "-")}`}
                                    className="block px-4 py-1 hover:bg-gray-200 rounded-md"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    <div className="col-span-3 border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/womens"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Womens
                      </Link>
                    </div>
                  </div>

                  {/* Right side - Smaller Image with fixed max-height */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {" "}
                    {/* Center image */}
                    {dropdownData.womens.rightImage && (
                      <img
                        src={dropdownData.womens.rightImage}
                        alt="Womens Collection"
                        className="max-h-[300px] w-auto rounded-md object-contain" // **Fixed max-h in pixels, object-contain**
                      />
                    )}
                  </div>
                </div>
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
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4  w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2" // Full screen width, 2 columns
                  style={{ left: 0, width: "100vw" }} // Ensure full viewport width
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Left side - Categories and Items */}
                  <div className="grid grid-cols-1 gap-x-4">
                    {" "}
                    {/* Single column for Accessories */}
                    {Object.entries(dropdownData.accessories)
                      .filter(([key]) => key !== "rightImage")
                      .map(
                        (
                          [category, categoryData] // Filter rightImage and Collections gone
                        ) => (
                          <div key={category}>
                            <div className="flex items-center mb-2">
                              {categoryData.image && (
                                <img
                                  src={categoryData.image}
                                  alt={category}
                                  className="w-8 h-8 mr-2 rounded-md"
                                />
                              )}
                              <h3 className="font-semibold">{category}</h3>
                            </div>
                            <ul className="space-y-2">
                              {categoryData.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`/accessories/${item
                                      .toLowerCase()
                                      .replace(/ /g, "-")}`}
                                    className="block px-4 py-1 hover:bg-gray-200 rounded-md"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/accessories"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Accessories
                      </Link>
                    </div>
                  </div>

                  {/* Right side - Smaller Image with fixed max-height */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {" "}
                    {/* Center image */}
                    {dropdownData.accessories.rightImage && (
                      <img
                        src={dropdownData.accessories.rightImage}
                        alt="Accessories Collection"
                        className="max-h-[300px] w-auto rounded-md object-contain" // **Fixed max-h in pixels, object-contain**
                      />
                    )}
                  </div>
                </div>
              )}
            </li>
            {/* Footwear, E-Voucher and Sale Links Removed */}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
