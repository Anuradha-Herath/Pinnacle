"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const orders = [
  {
    id: 23,
    product: "Classic Seamless Long Sleeve Tee",
    price: 3050.0,
    quantity: 2,
    image: "p9.webp", // Replace with actual image path
  },
  {
    id: 25,
    product: "Classic Seamless Long Sleeve Tee",
    price: 3050.0,
    quantity: 2,
    image: "p8.webp", // Replace with actual image path
  },
];

export default function ReviewPage() {
  return (
    <div className="bg-gray-100">
      <Header />
      <main className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">To Review</h1> {/* Increased font size */}
        <div className="space-y-6"> {/* Increased spacing */}
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-md p-6 rounded-lg flex flex-col space-y-4 relative"> {/* Changed to flex-col and added space-y-4 */}
              <div className="flex items-center space-x-4"> {/* Increased spacing */}
                <p className="font-semibold text-lg">Order #{order.id}</p> {/* Increased font size */}
                <span className="text-sm bg-gray-800 text-white px-3 py-1 rounded">Delivered</span> {/* Increased font size and padding */}
              </div>
              <div className="flex items-center justify-between"> {/* Added flex and justify-between */}
                <img src={order.image} alt={order.product} className="w-20 h-24 object-cover rounded" /> {/* Increased image size */}
                <div className="ml-4"> {/* Added margin-left */}
                  <p className="text-gray-700 text-lg">{order.product}</p> {/* Increased font size */}
                  <p className="font-semibold text-lg">Rs.{order.price.toFixed(2)}</p> {/* Increased font size */}
                </div>
                <div className="flex items-center space-x-20 text-right"> {/* Reduced spacing */}
                  <p className="text-gray-700 text-lg">Qty: {order.quantity}</p> {/* Increased font size */}
                  <button className="bg-gray-900 text-white px-4 py-2 rounded-lg">Review This Item</button> {/* Adjusted padding */}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1 cursor-pointer absolute bottom-2 right-2">View Details</p> {/* Positioned in the bottom right corner */}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}