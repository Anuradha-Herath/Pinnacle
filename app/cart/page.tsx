"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Trash, Plus, Minus, ShoppingBag } from "lucide-react";

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const total = getCartTotal();
  const placeholderImage = '/placeholder.png';

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === '') return false;
    
    try {
      if (url.startsWith('/')) return true;
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        <h1 className="text-2xl font-semibold mb-6">Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/"
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => {
                // Ensure image is valid
                const itemImage = isValidImageUrl(item.image) ? 
                  (item.image.startsWith('data:') ? placeholderImage : item.image) : 
                  placeholderImage;
                  
                return (
                  <div
                    key={item.variantKey || item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20">
                        <Image
                          src={itemImage}
                          alt={item.name}
                          fill
                          className="object-contain rounded"
                          sizes="80px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = placeholderImage;
                          }}
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-medium">{item.name}</h2>
                        <div className="text-gray-500 text-sm">
                          {/* Display variant information if available */}
                          {item.size && <span className="mr-2">Size: {item.size}</span>}
                          {item.color && 
                            <span className="flex items-center">
                              <span className="mr-1">Color:</span>
                              <span className="relative w-4 h-4 rounded-full overflow-hidden inline-block align-middle">
                                <Image 
                                  src={item.color} 
                                  alt="Color" 
                                  fill 
                                  className="object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = placeholderImage;
                                  }}
                                />
                              </span>
                            </span>
                          }
                        </div>
                        <p className="text-gray-600">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 mt-4 sm:mt-0 self-end sm:self-auto">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => updateQuantity(item.variantKey || item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100 rounded-l-md"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-3 py-1 border-x">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantKey || item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100 rounded-r-md"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variantKey || item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 border-b pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-lg mt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" passHref>
                <button className="mt-6 w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors">
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default CartPage;
