"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "react-feather";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import Image from "next/image";

function Checkout() {
  const [shipping, setShipping] = useState("ship");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { cartItems, getCartTotal } = useCart();
  const subtotal = getCartTotal();
  const shippingCost = 10; // Fixed shipping cost of Rs 650
  const total = subtotal + shippingCost;
  const placeholderImage = "/placeholder.png";

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === "") return false;

    try {
      if (url.startsWith("/")) return true;
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

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
      <Header />

      <main className="flex flex-col md:flex-row p-8 gap-8 pt-16">
        {/* Left Section: Form */}
        <div className="w-full md:w-4/5 p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-2 mb-4 border border-gray-500 rounded"
          />
          <label className="flex items-center gap-2 mb-4">
            <input type="checkbox" /> Email me with news and offers
          </label>

          <h2 className="text-xl font-semibold mb-4">Delivery</h2>
          <div className="flex gap-4 mb-4">
            <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
              <input
                type="radio"
                name="delivery"
                checked={shipping === "ship"}
                onChange={() => setShipping("ship")}
              />
              <span>Ship</span>
            </div>
            <div className="p-3 border border-gray-500 rounded-lg bg-white flex items-center gap-2 w-full">
              <input
                type="radio"
                name="delivery"
                checked={shipping === "pickup"}
                onChange={() => setShipping("pickup")}
              />
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
            <input
              type="text"
              placeholder="First name"
              className="p-2 border border-gray-500 rounded"
            />
            <input
              type="text"
              placeholder="Last name"
              className="p-2 border border-gray-500 rounded"
            />
          </div>

          <input
            type="text"
            placeholder="Address"
            className="w-full p-2 mb-4 border border-gray-500 rounded"
          />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="City"
              className="p-2 border border-gray-500 rounded"
            />
            <input
              type="text"
              placeholder="Postal code"
              className="p-2 border border-gray-500 rounded"
            />
          </div>
          <input
            type="text"
            placeholder="Phone"
            className="w-full p-2 mb-4 border border-gray-500 rounded"
          />

          <h2 className="text-xl font-semibold mb-4">Shipping method</h2>
          <div className="p-3 border border-gray-500 rounded bg-white flex justify-between">
            <span>Standard Shipping</span>
            <span>Rs {shippingCost.toFixed(2)}</span>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow-md border border-gray-300 mt-6">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <p className="text-gray-500 mb-2">
              All transactions are secure and encrypted
            </p>
            <input
              type="text"
              placeholder="Card Number"
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Exp date (MM/YY)"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Security code"
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <input
              type="text"
              placeholder="Name on card"
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Use shipping address as billing address
            </label>
            <Link href="/payment">
              <button className="w-full mt-6 p-3 bg-black text-white rounded">
                Pay now
              </button>
            </Link>
          </div>
        </div>

        {/* Right Section: Order Summary */}
        <div className="w-full md:w-2/3 p-6 bg-gray-100 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="mb-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => {
                const itemImage = isValidImageUrl(item.image)
                  ? item.image
                  : placeholderImage;
                const itemKey =
                  item.variantKey || item.id || `checkout-item-${index}`;

                return (
                  <div
                    key={itemKey}
                    className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4"
                  >
                    <div className="relative w-32 h-40">
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        sizes="128px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.color && (
                        <p className="text-sm text-gray-600">
                          Color: {item.color}
                        </p>
                      )}
                      {item.size && (
                        <p className="text-sm text-gray-600">
                          Size: {item.size}
                        </p>
                      )}
                      {item.quantity && (
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      )}
                      {item.discount && (
                        <p className="text-xs text-red-500">
                          Sale {item.discount}% OFF (-Rs{" "}
                          {((item.price * item.discount) / 100).toFixed(2)})
                        </p>
                      )}
                    </div>
                    <span className="ml-auto font-semibold">
                      Rs {(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">
                Your cart is empty
              </p>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Discount code"
              className="flex-1 p-2 border border-gray-200 rounded"
            />
            <button className="p-2 bg-gray-400 text-white rounded w-1/4">
              Apply
            </button>
          </div>
          <div className="flex justify-between font-semibold leading-8 text-lg">
            <span>Sub total </span>
            <span>Rs {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>Rs {shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mt-3">
            <span>Total</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
export default Checkout;
