"use client";

import React from "react";

const BestSellingItems: React.FC = () => {
  const items = [
    {
      name: "Crocodile Tee",
      price: "$126.50",
      sales: "996 Sales",
    },
    {
      name: "Nike Tee",
      price: "$126.50",
      sales: "996 Sales",
    },
    {
      name: "Addidas Tee",
      price: "$126.50",
      sales: "996 Sales",
    },
  ];

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Best Selling Items</h3>
        <span className="text-gray-500">:</span>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">{item.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{item.sales}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 w-full bg-orange-500 text-white p-2 rounded">
        VIEW ALL
      </button>
    </div>
  );
};

export default BestSellingItems;
