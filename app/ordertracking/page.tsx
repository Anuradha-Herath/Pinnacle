"use client";
import { useState } from "react";
import { Button, Link } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfilePageToNav from "../components/ProfilePageToNav";

export default function OrderDetailsPage() {
  const order = {
    orderNumber: "342352834724-0021",
    placedDate: "01/04/2024",
    status: "Shipped", // Change this to test different statuses
    trackingNumber: "1Z384DD77",
    placedBy: "John Adams",
    shippingAddress: "123/ Baker Street, Birmingham, London",
    paymentMethod: {
      cardType: "Visa Card",
      cardHolder: "H. L. U. M. Perera",
      cardNumber: "**********0894",
      bank: "Asia Bank",
    },
    statusTimeline: [
      { label: "Ordered", date: "Tue , Jul 10" },
      { label: "Processed", date: "Thu , Jul 12" },
      { label: "Shipped", date: "Fri , Jul 13" },
      { label: "Out to Delivery", date: "Sat , Jul 14" },
      { label: "Delivered", date: "Sun , Jul 15" },
    ],
    items: [
      {
        name: "Classic Seamless Long Sleeve Tee",
        price: 3050.0,
        quantity: 2,
        image: "/p3.webp",
      },
      {
        name: "Classic Seamless Long Sleeve Tee",
        price: 4000.0,
        quantity: 4,
        image: "/p4.webp",
      },
    ],
    deliveryFee: 300.0,
  };

  // Calculate Subtotal
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate Total
  const total = subtotal + order.deliveryFee;

  // Find current status index
  const currentStatusIndex = order.statusTimeline.findIndex(
    (step) => step.label === order.status
  );

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Order Details</h2>

        {/* Order Information */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold">
              Order Number: {order.orderNumber}
            </h3>
            <p>
              <strong>Order Placed:</strong> {order.placedDate}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Order Placed By:</strong> {order.placedBy}
            </p>
            <p>
              <strong>Tracking #:</strong>{" "}
              <Link href="#" className="text-blue-600">
                {order.trackingNumber}
              </Link>
            </p>
          </div>

          {/* Shipping & Payment Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Shipping Address</h3>
              <p>{order.shippingAddress}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Payment Method</h3>
              <p>{order.paymentMethod.cardType}</p>
              <p>{order.paymentMethod.cardHolder}</p>
              <p>{order.paymentMethod.cardNumber}</p>
              <p>{order.paymentMethod.bank}</p>
            </div>
          </div>

          {/* Order Tracking Timeline */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="relative py-8">
              {/* Horizontal line */}
              <div className="absolute left-0 right-0 top-1/10 h-[35px] bg-gray-300 rounded-lg" />

              <div className="relative flex justify-between">
                {order.statusTimeline.map((step, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`mb-2 h-9 w-9 rounded-full flex items-center justify-center border-2 gray-300 p-2
            ${index <= currentStatusIndex ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      {index <= currentStatusIndex && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{step.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-2">Order Items</h3>
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b pb-2 mb-2"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-18 rounded-lg"
              />
              <div className="flex-grow">
                <p className="font-semibold">{item.name}</p>
                <p className="text-lg font-bold">Rs. {item.price.toFixed(2)}</p>
              </div>
              <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
              <p className="font-semibold">
                Rs. {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          {/* Summary Section */}
          <p className="text-base font-bold mt-2 text-right">
            <strong>Subtotal:</strong> Rs. {subtotal.toFixed(2)}
          </p>
          <p className="text-base font-bold mt-2 text-right">
            <strong>Delivery Fee:</strong> Rs. {order.deliveryFee.toFixed(2)}
          </p>
          <p className="text-base font-bold mt-2 text-right">
            <strong>Total:</strong> Rs. {total.toFixed(2)}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
