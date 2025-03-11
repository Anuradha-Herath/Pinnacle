"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, User, Heart, ShoppingBag, ChevronDown, X } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useAuth } from "../context/AuthContext";
import { authNotifications } from "@/lib/notificationService";

// Define types for suggestions
interface Suggestion {
  id: string;
  name: string;
  image?: string;
  type?: string;
}

// Define types for categories
interface Category {
  _id: string;
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  mainCategory: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [menCategories, setMenCategories] = useState<Category[]>([]);
  const [womenCategories, setWomenCategories] = useState<Category[]>([]);
  const [accessoriesCategories, setAccessoriesCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  let userDropdownTimeout: NodeJS.Timeout;
  
  // Refs for click outside detection
  const searchRef = useRef<HTMLDivElement>(null!);
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

  // Fetch categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
        
        // Group categories by mainCategory
        const men = data.categories.filter((cat: Category) => cat.mainCategory === 'Men');
        const women = data.categories.filter((cat: Category) => cat.mainCategory === 'Women');
        const accessories = data.categories.filter((cat: Category) => cat.mainCategory === 'Accessories');
        
        setMenCategories(men);
        setWomenCategories(women);
        setAccessoriesCategories(accessories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        openDropdown && 
        dropdownRef.current &&
        !(dropdownRef.current as HTMLElement).contains(event.target as Node)
      ) {
        // Check if the clicked element is a dropdown toggle button
        const isToggleButton = (event.target as Element).closest('button')?.textContent?.includes('Mens') ||
          (event.target as Element).closest('button')?.textContent?.includes('Womens') ||
          (event.target as Element).closest('button')?.textContent?.includes('Accessories');

        // Only close dropdown if click was not on a toggle button
        if (!isToggleButton) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [openDropdown]);

  const handleUserMouseEnter = () => {
    clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    userDropdownTimeout = setTimeout(() => {
      setShowUserDropdown(false);
    }, 300); // 300ms delay to allow mouse movement to dropdown
  };

  const handleLogout = async () => {
    await logout();
    // Use notification service instead of direct toast call
    authNotifications.logoutSuccess();
    router.push('/login');
  };

  return (
    <header className="bg-black text-white relative z-50">
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
            {user ? (
              <div className="relative" 
                   onMouseEnter={handleUserMouseEnter} 
                   onMouseLeave={handleUserMouseLeave}>
                <div className="flex items-center cursor-pointer hover:text-gray-300">
                  <User className="h-6 w-6" />
                  <span className="ml-2">Hi, {user.firstName}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </div>
                
                {/* User Dropdown Menu - Now controlled by state instead of CSS hover */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded-md overflow-hidden z-50">
                    <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 hover:bg-gray-100">
                      Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">
                        Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-t border-gray-200"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center cursor-pointer hover:text-gray-300">
                <User className="h-6 w-6" />
                <span className="ml-2">Sign in</span>
              </Link>
            )}
            
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
              <Link href="/category/Men" className="flex items-center hover:text-gray-300">
                Mens
                <ChevronDown className="ml-1 h-4 w-4" />
              </Link>
              
              {openDropdown === "mens" && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2 z-50"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Mens dropdown content */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {categoriesLoading ? (
                      <div className="col-span-3 text-center py-8">
                        <div className="mx-auto h-6 w-6 border-2 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="mt-2 text-gray-500">Loading categories...</p>
                      </div>
                    ) : menCategories.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500">No categories found</p>
                      </div>
                    ) : (
                      <>
                        {/* Group by subcategories - we'll show all men categories directly for now */}
                        <div className="col-span-3">
                          <h3 className="font-semibold text-lg mb-2 border-b pb-1">Men's Categories</h3>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            {menCategories.map((category) => (
                              <Link 
                                key={category._id} 
                                href={`/category/Men/${encodeURIComponent(category.title)}`}
                                className="hover:text-orange-500 py-1"
                              >
                                {/* Display the original title (not encoded) */}
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="col-span-3 border-t border-gray-200 mt-4 pt-2">
                      <Link
                        href="/category/Men"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Men's
                      </Link>
                    </div>
                  </div>
                  
                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    <img
                      src="/p1.webp"
                      alt="Men's Collection"
                      className="max-h-[450px] w-auto rounded-md object-contain"
                    />
                  </div>
                </div>
              )}
            </li>

            {/* Women's Dropdown */}
            <li
              className="relative"
              onMouseEnter={() => handleMouseEnter("womens")}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/category/Women" className="flex items-center hover:text-gray-300">
                Womens
                <ChevronDown className="ml-1 h-4 w-4" />
              </Link>
              
              {openDropdown === "womens" && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2 z-50"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Women's dropdown content */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {categoriesLoading ? (
                      <div className="col-span-3 text-center py-8">
                        <div className="mx-auto h-6 w-6 border-2 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="mt-2 text-gray-500">Loading categories...</p>
                      </div>
                    ) : womenCategories.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500">No categories found</p>
                      </div>
                    ) : (
                      <>
                        {/* Display women categories */}
                        <div className="col-span-3">
                          <h3 className="font-semibold text-lg mb-2 border-b pb-1">Women's Categories</h3>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            {womenCategories.map((category) => (
                              <Link 
                                key={category._id} 
                                href={`/category/Women/${encodeURIComponent(category.title)}`}
                                className="hover:text-orange-500 py-1"
                              >
                                {/* Display the original title (not encoded) */}
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="col-span-3 border-t border-gray-200 mt-4 pt-2">
                      <Link
                        href="/category/Women"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Women's
                      </Link>
                    </div>
                  </div>
                  
                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    <img
                      src="/p2.webp"
                      alt="Women's Collection"
                      className="max-h-[300px] w-auto rounded-md object-contain"
                    />
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
              <Link href="/category/Accessories" className="flex items-center hover:text-gray-300">
                Accessories
                <ChevronDown className="ml-1 h-4 w-4" />
              </Link>
              
              {openDropdown === "accessories" && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 bg-white text-black shadow-lg rounded-lg p-4 w-screen max-h-[70vh] overflow-y-auto grid grid-cols-2 z-50"
                  style={{ left: 0, width: "100vw" }}
                  onMouseEnter={() => clearTimeout(timeout)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Accessories dropdown content */}
                  <div className="grid grid-cols-3 gap-x-4">
                    {categoriesLoading ? (
                      <div className="col-span-3 text-center py-8">
                        <div className="mx-auto h-6 w-6 border-2 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="mt-2 text-gray-500">Loading categories...</p>
                      </div>
                    ) : accessoriesCategories.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500">No categories found</p>
                      </div>
                    ) : (
                      <>
                        {/* Display accessories categories */}
                        <div className="col-span-3">
                          <h3 className="font-semibold text-lg mb-2 border-b pb-1">Accessories Categories</h3>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            {accessoriesCategories.map((category) => (
                              <Link 
                                key={category._id} 
                                href={`/category/Accessories/${encodeURIComponent(category.title)}`}
                                className="hover:text-orange-500 py-1"
                              >
                                {/* Display the original title (not encoded) */}
                                {category.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="col-span-3 border-t border-gray-200 mt-4 pt-2">
                      <Link
                        href="/category/Accessories"
                        className="block px-4 py-2 hover:bg-gray-200 rounded-md text-center font-semibold"
                      >
                        Shop All Accessories
                      </Link>
                    </div>
                  </div>
                  
                  {/* Right side image */}
                  <div className="pl-4 border-l border-gray-200 flex items-center justify-center">
                    <img
                      src="/p3.webp"
                      alt="Accessories Collection"
                      className="max-h-[300px] w-auto rounded-md object-contain"
                    />
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
