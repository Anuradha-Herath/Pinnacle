"use client";

import React, { useState } from "react";

const CustomerProfilePage = () => {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    address: "123 Main St, Anytown, USA",
    phone: "555-1234",
  });
  const [editMode, setEditMode] = useState(false);
  const [orders] = useState([
    {
      id: 101,
      date: "2023-08-15",
      total: 99.99,
      status: "Delivered",
    },
    {
      id: 102,
      date: "2023-09-02",
      total: 49.99,
      status: "Processing",
    },
    {
      id: 103,
      date: "2023-09-10",
      total: 79.99,
      status: "Shipped",
    },
  ]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEditMode(false);
    alert("Profile updated!");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-start py-8 space-y-8">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div>
              <label className="block text-gray-700">Phone</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p>
              <span className="font-semibold">Name:</span> {profile.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {profile.address}
            </p>
            <p>
              <span className="font-semibold">Phone:</span> {profile.phone}
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Order History</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 border rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-gray-600">Date: {order.date}</p>
                  <p className="text-gray-600">
                    Total: ${order.total.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      order.status === "Delivered"
                        ? "text-green-600"
                        : order.status === "Shipped"
                        ? "text-blue-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
                <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfilePage;
