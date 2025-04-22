"use client";

import React, { useState } from "react";
import Link from "next/link";

const OrderDetailsPage = () => {
  const [order] = useState({
    id: 123456,
    date: "2023-09-15",
    status: "Shipped",
    trackingNumber: "TRACK123456789",
    shippingAddress: {
      name: "John Doe",
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      postalCode: "12345",
      country: "USA",
    },
    items: [
      {
        id: 1,
        name: "Black T-Shirt",
        price: 25.99,
        quantity: 2,
        image: "/p1.webp",
      },
      {
        id: 2,
        name: "Blue Jeans",
        price: 49.99,
        quantity: 1,
        image: "/p1.webp",
      },
    ],
  });

  const totalPrice = order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Details</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
        <p>
          <span className="font-semibold">Order Number:</span> #{order.id}
        </p>
        <p>
          <span className="font-semibold">Order Date:</span> {order.date}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {order.status}
        </p>
        <p>
          <span className="font-semibold">Tracking Number:</span>{" "}
          {order.trackingNumber}
        </p>
        <h3 className="mt-4 font-semibold">Shipping Address:</h3>
        <p>{order.shippingAddress.name}</p>
        <p>{order.shippingAddress.address}</p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.postalCode}
        </p>
        <p>{order.shippingAddress.country}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 border-b pb-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-md"
              />
              <div className="flex-grow">
                <h3 className="font-semibold">{item.name}</h3>
                <p>Price: ${item.price.toFixed(2)}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
              <div className="font-bold">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-xl font-bold">
          Total: ${totalPrice.toFixed(2)}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Order Tracking</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <p className="ml-4">Order Placed</p>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <p className="ml-4">Order Confirmed</p>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
            <p className="ml-4">Order Shipped</p>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <p className="ml-4">Out for Delivery</p>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <p className="ml-4">Delivered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
