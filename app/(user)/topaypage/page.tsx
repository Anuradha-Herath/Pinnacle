"use client";
import { useState } from "react";
import { Button, Link } from "@mui/material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProfilePageToNav from "../../components/ProfilePageToNav";

export default function ToPayPage() {
  const [orders, setOrders] = useState([
    {
      id: 30,
      status: "To Pay",
      items: [
        {
          name: "Black Tee",
          price: 3500.0,
          quantity: 2,
          image: "/p1.webp",
        },
        {
          name: "White Devil Tee",
          price: 3000.0,
          quantity: 4,
          image: "/p2.webp",
        },
      ],
    },
    {
      id: 31,
      status: "To Pay",
      items: [
        {
          name: "Black Cap",
          price: 2990.0,
          quantity: 1,
          image: "/cap1.webp",
        },
      ],
    },
  ]);

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">To Pay Orders</h2>
        <ProfilePageToNav />
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-100 p-4 rounded-lg shadow-md mb-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Order #{order.id}</h3>
              <span className="bg-black text-white px-3 py-1 rounded-lg">
                {order.status}
              </span>
            </div>
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 mt-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg"
                />
                <div className="flex-grow">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-lg font-bold">
                    Rs. {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="ml-auto text-sm text-gray-600">
                  Qty: {item.quantity}
                </div>
              </div>
            ))}
            <div className="text-right mt-2">
              {/* Calculate total dynamically */}
              <p className="font-semibold">
                Total: Rs.{" "}
                {order.items
                  .reduce((acc, item) => acc + item.price * item.quantity, 0)
                  .toFixed(2)}
              </p>
              <Link href="/cart">
                <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 mt-3 mb-1">
                  Pay Now
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
