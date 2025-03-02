"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, ChevronDown, X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

// Define types for suggestions
interface Suggestion {
  id: string;
  name: string;
  image?: string;
  type?: string;
}

const Header = () => {
  const router = useRouter();
  const { wishlist } = useWishlist();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Refs for click outside detection
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef(null);
  
  let timeout: NodeJS.Timeout;

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  // Handle clicking on a suggestion
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'category') {
      // Extract category name by removing " (Category)" suffix
      const categoryName = suggestion.name.replace(' (Category)', '');
      router.push(`/search?category=${encodeURIComponent(categoryName)}`);
    } else {
      router.push(`/product/${suggestion.id}`);
    }
    setShowSuggestions(false);
    setSearchQuery(""); // Clear search query after navigation
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms debounce time
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useOnClickOutside(searchRef, () => setShowSuggestions(false));

  const handleMouseEnter = (menu: string) => {
    clearTimeout(timeout);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  // Define dropdown data with proper structure
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

  // Safely remove Collections property if it exists
  if (dropdownData.mens && 'Collections' in dropdownData.mens) {
    delete dropdownData.mens.Collections;
  }
  if (dropdownData.womens && 'Collections' in dropdownData.womens) {
    delete dropdownData.womens.Collections;
  }

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // ... existing document click handler ...
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
            <div className="relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products or brands"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full px-4 py-2 pl-10 bg-gray-800 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                  <button type="submit" className="absolute left-3 top-2.5">
                    <Search className="h-5 w-5 text-gray-400" />
                  </button>
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSuggestions([]);
                      }}
                      className="absolute right-3 top-2.5"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </form>
              
              {/* Search suggestions dropdown */}
              {showSuggestions && searchQuery.trim().length > 1 && (
                <div className="absolute left-0 right-0 mt-1 bg-white text-black shadow-lg rounded-md overflow-hidden z-50">
                  {isLoading ? (
                    <div className="p-3 text-center text-gray-500">
                      Loading suggestions...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          {suggestion.image && !suggestion.type && (
                            <div className="w-10 h-10 relative mr-2">
                              <Image
                                src={suggestion.image || '/placeholder.png'}
                                alt={suggestion.name}
                                fill
                                className="object-cover rounded"
                                sizes="40px"
                              />
                            </div>
                          )}
                          <div className="flex-1 truncate">
                            {suggestion.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-gray-500">
                      No suggestions found
                    </div>
                  )}
                </div>
              )}
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
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Mens dropdown content */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {Object.entries(dropdownData.mens)
                      .filter(([key]) => key !== "rightImage")
                      .map(([category, categoryData]) => (
                        <div key={category}>
                          {/* Category content */}
                        </div>
                      ))}
                    <div className="col-span-3 border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/mens"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Mens
                      </Link>
                    </div>
                  </div>
                  
                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {dropdownData.mens.rightImage && (
                      <img
                        src={dropdownData.mens.rightImage}
                        alt="Mens Collection"
                        className="max-h-[450px] w-auto rounded-md object-contain"
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
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Left side - Categories and Items */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {Object.entries(dropdownData.womens)
                      .filter(([key]) => key !== "rightImage")
                      .map(([category, categoryData]) => (
                        <div key={category}>
                          {/* Category content */}
                        </div>
                      ))}
                    <div className="col-span-3 border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/womens"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Womens
                      </Link>
                    </div>
                  </div>

                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {dropdownData.womens.rightImage && (
                      <img
                        src={dropdownData.womens.rightImage}
                        alt="Womens Collection"
                        className="max-h-[300px] w-auto rounded-md object-contain"
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
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Left side - Categories and Items */}
                  <div className="grid grid-cols-1 gap-x-4">
                    {Object.entries(dropdownData.accessories)
                      .filter(([key]) => key !== "rightImage")
                      .map(([category, categoryData]) => (
                        <div key={category}>
                          {/* Category content */}
                        </div>
                      ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <Link
                        href="/accessories"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Accessories
                      </Link>
                    </div>
                  </div>

                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    {dropdownData.accessories.rightImage && (
                      <img
                        src={dropdownData.accessories.rightImage}
                        alt="Accessories Collection"
                        className="max-h-[300px] w-auto rounded-md object-contain"
                      />
                    )}
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
