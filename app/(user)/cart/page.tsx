"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { cartNotifications } from "@/lib/notificationService";
import { getValidImageUrl, handleImageError } from "@/lib/imageUtils";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, isLoading } = useCart();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const cartItems = cart || [];
  const cartTotal = getCartTotal();

  const handleQuantityChange = (id: string, newQuantity: number, size: string | undefined, color: string | undefined) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity, size, color);
    }
    if (newQuantity === 0) {
      removeFromCart(id, size, color);
      cartNotifications.itemRemoved();
    }
  };

  const handleRemoveItem = (id: string, name: string, size: string | undefined, color: string | undefined) => {
    removeFromCart(id, size, color);
    cartNotifications.itemRemoved();
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const getDisplayColorName = (color: string | undefined) => {
    if (!color) return "Default";
    if (color.startsWith('http') || color.startsWith('/')) {
      const parts = color.split('/');
      const fileName = parts[parts.length - 1];
      return fileName.split('.')[0].replace(/-|_/g, ' ');
    }
    return color;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl sm:text-2xl font-medium mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-900 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cartItems.map((item, index) => {
                        const displayColorName = getDisplayColorName(item.color);
                        return (
                          <tr key={`${item.id}-${item.size}-${item.color}-${index}`}>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                  <img
                                    src={getValidImageUrl(item.image)}
                                    alt={item.name}
                                    className="h-full w-full object-contain"
                                    onError={handleImageError}
                                  />
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name || "Product"}
                                  </div>
                                  {item.size && (
                                    <div className="text-xs sm:text-sm text-gray-500">
                                      Size: {item.size}
                                    </div>
                                  )}
                                  {item.color && (
                                    <div className="text-xs sm:text-sm text-gray-500">
                                      Color: {displayColorName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.discountedPrice !== undefined && item.discountedPrice !== null ? (
                                  <>
                                    <span className="line-through text-gray-500 mr-2">
                                      ${(item.price || 0).toFixed(2)}
                                    </span>
                                    <span className="text-red-600 font-medium">
                                      ${(item.discountedPrice || 0).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <>${(item.price || 0).toFixed(2)}</>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center border rounded-md w-fit mx-auto">
                                <button
                                  className="px-2 py-1"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1,
                                      item.size,
                                      item.color
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-2 sm:px-4 py-1">{item.quantity}</span>
                                <button
                                  className="px-2 py-1"
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1,
                                      item.size,
                                      item.color
                                    )
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.discountedPrice !== undefined && item.discountedPrice !== null ? (
                                  <>${((item.discountedPrice || 0) * item.quantity).toFixed(2)}</>
                                ) : (
                                  <>${((item.price || 0) * item.quantity).toFixed(2)}</>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() =>
                                  handleRemoveItem(item.id, item.name, item.size, item.color)
                                }
                                className="text-red-600 hover:text-red-800"
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(cartTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-medium">
                    <span>Total</span>
                    <span>${(cartTotal || 0).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-900 transition"
                  disabled={cartItems.length === 0}
                >
                  Checkout
                </button>

                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-sm text-gray-600 hover:underline"
                  >
                    or Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
