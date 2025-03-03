"use client";

import { useState } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function DiscountView() {
  const [discountData, setDiscountData] = useState({
    productId: "",
    discountValue: "",
    discountType: "Category",
    discountStatus: "active",
    startDate: "",
    endDate: ""
  });

  const handleRadioChange = (type: string) => {
    setDiscountData((prevState) => ({
      ...prevState,
      discountType: type
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Discount Data:", discountData);
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
            <h1 className="text-xl font-semibold">Discount Details</h1>
            <p className="text-sm text-gray-500">Home &gt; Discounts &gt; Details</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="col-span-2">
                {/* Discount Status */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Discount Status</h2>
                  <hr className="mb-4" />
                  <div className="flex gap-8">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="active"
                        checked={discountData.discountStatus === "active"}
                        onChange={() => setDiscountData({ ...discountData, discountStatus: "active" })}
                        className="w-3 h-3"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="inactive"
                        checked={discountData.discountStatus === "inactive"}
                        onChange={() => setDiscountData({ ...discountData, discountStatus: "inactive" })}
                        className="w-4 h-4"
                      />
                      <span>Inactive</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="future plan"
                        checked={discountData.discountStatus === "future plan"}
                        onChange={() => setDiscountData({ ...discountData, discountStatus: "future plan" })}
                        className="w-4 h-4"
                      />
                      <span>Future Plan</span>
                    </label>
                  </div>
                </div>

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
                      value={discountData.startDate}
                      onChange={(e) => setDiscountData({ ...discountData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">End Date</label>
                    <input
                      type="text"
                      placeholder="DD - MM - YYYY"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={discountData.endDate}
                      onChange={(e) => setDiscountData({ ...discountData, endDate: e.target.value })}
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
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="Category"
                          checked={discountData.discountType === "Category"}
                          onChange={() => handleRadioChange("Category")}
                          className="w-4 h-4"
                        />
                        <span>Category</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="Sub-category"
                          checked={discountData.discountType === "Sub-category"}
                          onChange={() => handleRadioChange("Sub-category")}
                          className="w-4 h-4"
                        />
                        <span>Sub-category</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="Product"
                          checked={discountData.discountType === "Product"}
                          onChange={() => handleRadioChange("Product")}
                          className="w-4 h-4"
                        />
                        <span>Product</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="All"
                          checked={discountData.discountType === "All"}
                          onChange={() => handleRadioChange("All")}
                          className="w-4 h-4"
                        />
                        <span>All</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-4">
                    <div className="w-full">
                      <label className="block text-sm mb-1">Category/Sub Category/Product ID</label>
                      <input
                        type="text"
                        placeholder="Enter ID"
                        className="block w-full border border-gray-300 p-2 rounded-xl"
                        value={discountData.productId}
                        onChange={(e) => setDiscountData({ ...discountData, productId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm mb-1">Discount Percentage</label>
                    <input
                      type="number"
                      placeholder="Discount Percentage"
                      className="block w-2/3 border border-gray-300 p-2 rounded-xl"
                      value={discountData.discountValue}
                      onChange={(e) => setDiscountData({ ...discountData, discountValue: e.target.value })}
                    />
                  </div>
                  
                  <hr className="mb-4" />
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="submit" className="bg-blue-500 text-white px-8 py-2 rounded">
                      SAVE
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
