"use client";

import React, { useState } from "react";
import Link from "next/link";

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([
    { id: 1, name: "Black T-Shirt", price: 25.99, image: "p1.webp" },
    { id: 2, name: "Blue Jeans", price: 49.99, image: "p2.webp" },
  ]);

  const removeFromWishlist = (id) => {
    setWishlist(wishlist.filter((item) => item.id !== id));
  };

  const moveToCart = (id) => {
    alert("Item moved to cart!");
    removeFromWishlist(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white shadow-md"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-gray-600">${item.price.toFixed(2)}</p>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => moveToCart(item.id)}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Move to Cart
                </button>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/shop" passHref>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
};

export default WishlistPage;
