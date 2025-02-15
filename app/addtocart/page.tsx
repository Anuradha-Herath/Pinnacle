"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Black T-Shirt",
      price: 25.99,
      image: "/products/black-tshirt.jpg",
      quantity: 1,
    },
    {
      id: 2,
      name: "Blue Jeans",
      price: 49.99,
      image: "/products/blue-jeans.jpg",
      quantity: 1,
    },
  ]);

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, amount) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded"
                    priority
                  />
                  <div>
                    <h2 className="text-lg font-medium">{item.name}</h2>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    <p className="text-gray-600">
                      Total: ${Number(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="px-2 py-1 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="px-2 py-1 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="bg-gray-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <p className="text-lg">
              Total: <span className="font-bold">${totalPrice.toFixed(2)}</span>
            </p>
            <Link href="/checkout" passHref>
              <button className="mt-4 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
