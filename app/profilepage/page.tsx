"use client";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { Button, Link } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "Micheal Scofiled",
    email: "Micheal369@gmail.com",
    phone: "+94773445698",
    address: "22/B Rosmead Place, Colombo 07",
    points: 294,
  });

  const orders1 = [
    {
      id: 24,
      status: "Out For Delivery",
      items: [
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt1.png", // Replace with actual image path
        },
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt2.png", // Replace with actual image path
        },
      ],
    },
  ];

  const orders2 = [
    {
      id: 25,
      status: "Delivered",
      items: [
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt1.png", // Replace with actual image path
        },
      ],
    },
  ];

  return (
    <><Header /><div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                  {user.name} <FaCrown className="text-yellow-500" />
              </h1>
          </div>

          {/* Navigation */}
          <div className="flex justify-end space-x-6 text-lg font-semibold">
              <a href="#" className="hover:underline">
                  Wishlist
              </a>
              <a href="#" className="hover:underline">
                  Payment Options
              </a>
          </div>

          {/* Customer Details */}
          <div className="bg-gray-100 p-4 rounded-lg mt-6 shadow-md">
              <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
              <p>
                  <strong>Name:</strong> {user.name}
              </p>
              <p>
                  <strong>Email:</strong> {user.email}
              </p>
              <p>
                  <strong>Phone:</strong> {user.phone}
              </p>
              <p>
                  <strong>Delivery Address:</strong> {user.address}
              </p>
              <Button className="mt-3 flex items-center gap-2">
                  <FiEdit /> Edit Details
              </Button>
          </div>

          {/* Coupon and Points Section */}
          <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Collect Coupon */}
              <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                  <div className="text-2xl">&#x1F4B3;</div>
                  <p>Collect coupon to get discounts!</p>
                  <Button className="mt-2">Collect</Button>
              </div>

              {/* Points */}
              <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                  <div className="text-2xl">&#x2728;</div>
                  <p className="text-3xl font-bold">{user.points}</p>
              </div>
          </div>

          {/* My Orders Section */}
          <div className="mt-10">
              <h2 className="text-2xl font-bold mb-4">My Orders</h2>

              {/* Order Navigation Icons */}
              <div className="flex space-x-10 text-center mb-4">
                  <div>
                      <div className="text-3xl">💳</div>
                      <p>To Pay</p>
                  </div>
                  <div>
                      <div className="text-3xl">🚚</div>
                      <p>To Receive</p>
                  </div>
                  <div>
                      <div className="text-3xl">✍️</div>
                      <p>To Review</p>
                  </div>
              </div>
          </div>
          {/* Order List */}
          {orders1.map((order) => (
              <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                      <span className="bg-black text-white px-3 py-1 rounded-lg">{order.status}</span>
                  </div>

                  {/* Order Items */}
                  {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 mt-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg" />
                          <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-lg font-bold">Rs. {item.price.toFixed(2)}</p>
                          </div>
                          <p className="ml-auto">Qty: {item.quantity}</p>
                      </div>
                  ))}

                  {/* View Details */}
                  <div className="text-right mt-2">
                      <a href="#" className="text-sm font-semibold hover:underline">View Details</a>
                  </div>
              </div>
          ))}
          {/* Order List */}
          {orders2.map((order) => (
              <div key={order.id} className="bg-gray-100 p-4 rounded-lg shadow-md mb-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                      <span className="bg-black text-white px-3 py-1 rounded-lg">{order.status}</span>
                  </div>

                  {/* Order Items */}
                  {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 mt-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg" />
                          <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-lg font-bold">Rs. {item.price.toFixed(2)}</p>
                          </div>
                          <p className="ml-auto">Qty: {item.quantity}</p>
                      </div>
                  ))}

                  {/* Review */}
                  <div className="text-right mt-2">
                    <Link href="/toreview">
                    <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 mb-1">
                    Review This Item
                    </button>
                    </Link>
                  </div>
                  {/* View Details */}
                  <div className="text-right mt-2">
                      <a href="#" className="text-sm font-semibold hover:underline">View Details</a>
                  </div>
              </div>
          ))}
      </div><Footer /></>
  );
}