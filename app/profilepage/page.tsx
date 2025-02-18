"use client";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { Button, Link } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReviewButton from "../components/ViewDetailsButtonInReivew";
import ProfilePageToNav from "../components/ProfilePageToNav";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "Micheal Scofiled",
    email: "Micheal369@gmail.com",
    phone: "+94773445698",
    address: "22/B Rosmead Place, Colombo 07",
    points: 294,
  });

  const orders = [
    {
      id: 24,
      status: "Out For Delivery",
      items: [
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt1.png",
        },
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt2.png",
        },
      ],
    },
    {
      id: 25,
      status: "Delivered",
      items: [
        {
          name: "Classic Seamless Long Sleeve Tee",
          price: 3050.0,
          quantity: 2,
          image: "/images/tshirt1.png",
        },
      ],
    },
  ];

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {user.name} <FaCrown className="text-yellow-500" />
          </h1>
        </div>
        <div className="flex justify-end space-x-6 text-lg font-semibold">
          <Link href="/wishlist" className="hover:underline">
            Wishlist
          </Link>
          <Link href="/#" className="hover:underline">
            Payment Options
          </Link>
        </div>
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
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl">&#x1F4B3;</div>
            <p>Collect coupon to get discounts!</p>
            <Button className="mt-2">Collect</Button>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl">&#x2728;</div>
            <p className="text-3xl font-bold">{user.points}</p>
          </div>
        </div>
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">My Orders</h2>
          <ProfilePageToNav />
        </div>
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
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-lg font-bold">
                    Rs. {item.price.toFixed(2)}
                  </p>
                </div>
                <p className="ml-auto">Qty: {item.quantity}</p>
              </div>
            ))}
            <ReviewButton status={order.status} />
            <div className="text-right mt-2">
              <a href="#" className="text-sm font-semibold hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
