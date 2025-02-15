"use client";

import React, { useState } from "react";
import Link from "next/link";

const CheckoutPage = () => {
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("paypal");

  const [cartItems] = useState([
    { id: 1, name: "Black T-Shirt", price: 25.99, quantity: 2 },
    { id: 2, name: "Blue Jeans", price: 49.99, quantity: 1 },
  ]);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setBillingDetails({ ...billingDetails, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Order placed successfully with ${paymentMethod}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Billing Details */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={billingDetails.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={billingDetails.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={billingDetails.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={billingDetails.city}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code"
              value={billingDetails.postalCode}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />

            {/* Payment Options */}
            <h2 className="text-xl font-semibold mt-6">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === "paypal"}
                  onChange={handlePaymentChange}
                  className="h-4 w-4"
                />
                <span>PayPal</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="payment"
                  value="credit_card"
                  checked={paymentMethod === "credit_card"}
                  onChange={handlePaymentChange}
                  className="h-4 w-4"
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={handlePaymentChange}
                  className="h-4 w-4"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 mt-4"
            >
              Place Order
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between mb-2">
              <p>
                {item.name} x {item.quantity}
              </p>
              <p>${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <hr className="my-4" />
          <p className="text-lg font-bold">Total: ${totalPrice.toFixed(2)}</p>
          <Link href="/cart" passHref>
            <button className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
              Edit Cart
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
