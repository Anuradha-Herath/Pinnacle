"use client";

import { useState } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponCreate() {
  const [formData, setFormData] = useState({
    couponCode: "",
    productId: "",
    limit: "",
    customerEligibility: "new user",
    discountType: "category",
    category: "",
    discountValue: "",
    oneTimeUse: false,
    couponStatus: "active",
    startDate: "",
    endDate: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Coupon Data:", formData);
    // API integration or logic for handling form submission
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          <div></div> {/* Empty div to push the items to the right */}
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

        {/* Content Area */}
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Coupons Details</h1>
            <p className="text-sm text-gray-500">Home &gt; Coupons &gt; Details</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="col-span-2">
                {/* Coupon Status */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Coupon Status</h2>
                  <hr className="mb-4" />
                  <div className="flex gap-8">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.couponStatus === "active"}
                        onChange={() => setFormData({ ...formData, couponStatus: "active" })}
                        className="w-3 h-3"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.couponStatus === "inactive"}
                        onChange={() => setFormData({ ...formData, couponStatus: "inactive" })}
                        className="w-4 h-4"
                      />
                      <span>Inactive</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="future plan"
                        checked={formData.couponStatus === "future plan"}
                        onChange={() => setFormData({ ...formData, couponStatus: "future plan" })}
                        className="w-4 h-4"
                      />
                      <span>Future Plan</span>
                    </label>
                  </div>
                </div>
                {/* Spacer for gap */}
                <div className="mb-20"></div>
                {/* Date Schedule */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-md font-medium mb-4">Date Schedule</h2>
                  <hr className="mb-4" />
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Start Date</label>
                    <input
                      type="text"
                      placeholder="DD - MM - YYYY"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">End Date</label>
                    <input
                      type="text"
                      placeholder="DD - MM - YYYY"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-3">
                {/* Discount Information */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
                  <h2 className="text-md font-medium mb-4">Discount Information</h2>
                  <hr className="mb-4" />
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Discount Type</label>
                    <div className="flex gap-4">
                      {['category', 'sub category', 'product', 'all'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={type}
                            checked={formData.discountType === type}
                            onChange={() => setFormData({ ...formData, discountType: type })}
                            className="w-4 h-4"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Category/Subcategory/Product ID</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Discount Percentage</label>
                    <input
                      type="text"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    />
                  </div>
                  <hr className="mb-4" />
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="submit" className="bg-blue-500 text-white px-8 py-2 rounded">
                      UPDATE
                    </button>
                    <button type="button" className="bg-red-500 text-white px-8 py-2 rounded">
                      DELETE
                    </button>
                    <button type="button" className="bg-gray-200 px-8 py-2 rounded">
                      CANCEL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
