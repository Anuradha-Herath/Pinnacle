"use client";

import { useState } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function DiscountCreate() {
  const [formData, setFormData] = useState({
    discountStatus: "active",
    startDate: "",
    endDate: "",
    discountType: "category",
    discountId: "",
    discountPercentage: ""
  });

  const handleSubmit = (e :React.FormEvent) => {
    e.preventDefault();
    console.log("Discount Data:", formData);
    // API integration logic
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <div className="flex justify-between items-center p-4">
          <div></div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <BellIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full">
              <ClockIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="rounded-full">
              <img src="/p4.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Discounts Create</h1>
            <p className="text-sm text-gray-500">Home &gt; Discounts &gt; Create</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2">
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Discount Status</h2>
                  <div className="flex gap-8">
                    {['active', 'inactive', 'future plan'].map((status) => (
                      <label key={status} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={status}
                          checked={formData.discountStatus === status}
                          onChange={() => setFormData({ ...formData, discountStatus: status })}
                        />
                        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-md font-medium mb-4">Date Schedule</h2>
                  <label className="block text-sm mb-1">Start Date</label>
                  <input type="text" placeholder="DD - MM - YYYY" className="w-full border p-2 rounded-xl" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                  <label className="block text-sm mt-4 mb-1">End Date</label>
                  <input type="text" placeholder="DD - MM - YYYY" className="w-full border p-2 rounded-xl" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>

              <div className="col-span-3">
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Discount Information</h2>
                  <div className="mb-4 flex gap-4">
                    {['category', 'sub-category', 'product', 'all'].map((type) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={type}
                          checked={formData.discountType === type}
                          onChange={() => setFormData({ ...formData, discountType: type })}
                        />
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      </label>
                    ))}
                  </div>

                  <label className="block text-sm mb-1">Category/Sub-Category/Product ID</label>
                  <input type="text" placeholder="Enter ID" className="w-full border p-2 rounded-xl" value={formData.discountId} onChange={(e) => setFormData({ ...formData, discountId: e.target.value })} />
                  
                  <label className="block text-sm mt-4 mb-1">Discount Percentage</label>
                  <input type="text" placeholder="Discount %" className="w-full border p-2 rounded-xl" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="submit" className="bg-red-500 text-white px-8 py-2 rounded">CREATE</button>
              <button type="button" className="bg-gray-200 px-8 py-2 rounded">CANCEL</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
