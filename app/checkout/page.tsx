"use client";
import { useState, useRef } from "react";
import Link from 'next/link';
import { Search, User, Heart, ShoppingBag, ChevronDown } from "react-feather";
import Footer from "../components/Footer";

function Checkout() {
  const [shipping, setShipping] = useState("ship"); // ✅ Inside function component
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (category: string) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(category);
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
            <ul className="flex space-x-8 py-3">
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
    
    <main className="flex flex-col md:flex-row p-8 gap-8 pt-16">
      {/* Left Section: Form */}
      <div className="w-full md:w-4/5 p-8 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Contact</h2>
        <input type="email" placeholder="Email Address" className="w-full p-2 mb-4 border border-gray-500 rounded" />
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" /> Email me with news and offers
        </label>

        <h2 className="text-xl font-semibold mb-4">Delivery</h2>
        <div className="flex gap-4 mb-4">
          <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
            <input type="radio" name="delivery" checked={shipping === "ship"} onChange={() => setShipping("ship")} /> 
            <span>Ship</span>
          </div>
          <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
            <input type="radio" name="delivery" checked={shipping === "pickup"} onChange={() => setShipping("pickup")} />
            <span>Pickup in store</span>
          </div>
        </div>

        <select className="w-full p-2 mb-4 border border-gray-500 rounded">
          <option>Country/Region</option>
          <option>India</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
        </select>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="First name" className="p-2 border border-gray-500 rounded" />
          <input type="text" placeholder="Last name" className="p-2 border border-gray-500 rounded" />
        </div>

        <input type="text" placeholder="Address" className="w-full p-2 mb-4 border border-gray-500 rounded" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="City" className="p-2 border border-gray-500 rounded" />
          <input type="text" placeholder="Postal code" className="p-2 border border-gray-500 rounded" />
        </div>
        <input type="text" placeholder="Phone" className="w-full p-2 mb-4 border border-gray-500 rounded" />

        <h2 className="text-xl font-semibold mb-4">Shipping method</h2>
        <div className="p-3 border border-gray-500 rounded bg-white flex justify-between">
          <span>Standard Shipping</span>
          <span>Rs 650.00</span>
        </div>
        <div className="p-6 bg-gray-100 rounded-lg shadow-md border border-gray-300 mt-6">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <p className="text-gray-500 mb-2">All transactions are secure and encrypted</p>
          <input type="text" placeholder="Card Number" className="w-full p-2 mb-4 border border-gray-300 rounded" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Exp date (MM/YY)" className="p-2 border border-gray-300 rounded" />
            <input type="text" placeholder="Security code" className="p-2 border border-gray-300 rounded" />
          </div>
          <input type="text" placeholder="Name on card" className="w-full p-2 mb-4 border border-gray-300 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Use shipping address as billing address
          </label>
          <Link href="/payment">
          <button className="w-full mt-6 p-3 bg-black text-white rounded">Pay now</button>
          </Link>
        </div>
      </div>

      {/* Right Section: Order Summary */}
      <div className="w-full md:w-2/3 p-6 bg-gray-100 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="mb-4">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
            <img src="/p8.webp" alt="V Neck Tee" className="w-32 h-40 rounded" />
            <div>
              <p className="font-semibold">V Neck Tee</p>
              <p className="text-sm text-gray-600">Color: V NECK TEE 01</p>
              <p className="text-sm text-gray-600">Size: M</p>
              <p className="text-xs text-red-500">Sale 30% OFF (-Rs 840.00)</p>
            </div>
            <span className="ml-auto font-semibold">Rs 1,960.00</span>
          </div>
          <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
            <img src="/p3.webp" alt="ADONIS" className="w-32 h-40 rounded" />
            <div>
              <p className="font-semibold">ADONIS</p>
              <p className="text-sm text-gray-600">Color: V NECK TEE 01</p>
              <p className="text-sm text-gray-600">Size: S</p>
              <p className="text-xs text-red-500">Sale 20% OFF (-Rs 2000.00)</p>
            </div>
            <span className="ml-auto font-semibold">Rs 8,000.00</span>
          </div>
        </div>
       
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Discount code" className="flex-1 p-2 border border-gray-200 rounded" />
          <button className="p-2 bg-gray-400 text-white rounded w-1/4">Apply</button>
        </div>
        <div className="flex justify-between font-semibold leading-8 text-lg">
          <span>Sub total </span>
          <span>Rs 9,960.00</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Rs 650.00</span>
        </div>
        <div className="flex justify-between font-bold text-xl mt-3">
          <span>Total</span>
          <span>Rs 10,610.00</span>
        </div>
      </div>
    </main>
    <Footer/>
  </div>
  );
};
export default Checkout;
