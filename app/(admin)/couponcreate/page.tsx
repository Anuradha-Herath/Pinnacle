"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponCreate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  interface FormData {
    code: string;
    product: string;
    price: string;
    discount: string;
    limit: string;
    customerEligibility: string;
    description: string;
    oneTimeUse: boolean;
    status: string;
    startDate: string;
    endDate: string;
    couponStatus: "active" | "inactive" | "future plan";
  }

  const statusMap = {
    "active": "Active",
    "inactive": "Inactive",
    "future plan": "Future"
  };

  const [formData, setFormData] = useState<FormData>({
    code: "",
    product: "",
    price: "",
    discount: "",
    limit: "",
    customerEligibility: "new user",
    description: "",
    oneTimeUse: false,
    status: statusMap["active"], // Default to "Active"
    startDate: "",
    endDate: "",
    couponStatus: "active",
  });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Map form status values to API expected format
      const statusMap = {
        "active": "Active",
        "inactive": "Inactive",
        "future plan": "Future"
      };
      
      const couponData = {
        ...formData,
        status: statusMap[formData.couponStatus] || formData.couponStatus
      };
      
      // Remove any undefined or null values
      Object.keys(couponData).forEach(key => {
        if (couponData[key as keyof FormData] === undefined || couponData[key as keyof FormData] === null) {
          delete couponData[key as keyof FormData];
        }
      });
      
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create coupon');
      }
      
      const result = await response.json();
      alert('Coupon created successfully!');
      router.push('/couponlist');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error creating coupon:', err);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-xl font-semibold">Coupons Create</h1>
            <p className="text-sm text-gray-500">Home &gt; Coupons &gt; Create</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="col-span-2 ">
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
                    <span>In Active</span>
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
                    type="date" 
                    className="block w-full border border-gray-300 p-2 rounded-xl" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                  </div>
                  <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input 
                    type="date" 
                    className="block w-full border border-gray-300 p-2 rounded-xl" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                  </div>
                </div>
                </div>

              {/* Right Column */}
              <div className="col-span-3">
                
                {/* Coupon Information and Customer Eligibility */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
                  <h2 className="text-md font-medium mb-4">Coupon Information</h2>
                  <hr className="mb-4" />
                  <div className="mb-4 flex items-center gap-4">
                  <div pl-10>
                    <label className="block text-sm mb-1 pr-10">Coupon Code</label>
                    <input
                    type="text"
                    placeholder="Code Enter"
                    className="block w-full border border-gray-300 p-2 rounded-xl"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    />
                  </div>
                  <div className="ml-auto pr-4 w-1/3">
                    <label className="block text-sm mb-1">Product Name</label>
                    <input 
                    type="text"
                    placeholder="Enter Product Name"
                    className="block w-full border border-gray-300 p-2 rounded-xl"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    required
                    />
                  </div>
                  </div>
                  
                  <div className="mb-4 flex items-center gap-4">
                    <div>
                      <label className="block text-sm mb-1">Price</label>
                      <input
                        type="text"
                        placeholder="Enter Price"
                        className="block w-full border border-gray-300 p-2 rounded-xl"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Discount</label>
                      <input
                        type="text"
                        placeholder="Enter Discount"
                        className="block w-full border border-gray-300 p-2 rounded-xl"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                  <label className="block text-sm mb-1">Coupon Limits</label>
                  <input
                  type="text"
                  placeholder="No Of Limits"
                  className="block w-1/3 border border-gray-300 p-2 rounded-xl"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  />
                  </div>
                  <h2 className="text-md font-medium mb-4">Customer Eligibility</h2>
                  <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2">
                  <input
                  type="radio"
                  value="new user"
                  checked={formData.customerEligibility === "new user"}
                  onChange={() => setFormData({ ...formData, customerEligibility: "new user" })}
                  className="w-4 h-4"
                  />
                  <span>New User</span>
                  </label>
                  <label className="flex items-center gap-2">
                  <input
                  type="radio"
                  value="loyalty customers"
                  checked={formData.customerEligibility === "loyalty customers"}
                  onChange={() => setFormData({ ...formData, customerEligibility: "loyalty customers" })}
                  className="w-4 h-4"
                  />
                  <span>Loyalty Customers</span>
                  </label>
                  <label className="flex items-center gap-2">
                  <input
                  type="radio"
                  value="all"
                  checked={formData.customerEligibility === "all"}
                  onChange={() => setFormData({ ...formData, customerEligibility: "all" })}
                  className="w-4 h-4"
                  />
                  <span>All</span>
                  </label>
                  </div>
                  <div className="mb-4">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    placeholder="Enter description"
                    className="block w-full border border-gray-300 p-2 rounded-xl"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                  </div>
                  <div>
                  <label className="flex items-center gap-2">
                  <input
                  type="checkbox"
                  checked={formData.oneTimeUse}
                  onChange={() => setFormData({ ...formData, oneTimeUse: !formData.oneTimeUse })}
                  className="w-4 h-4"
                  />
                  <span>One Time Use</span>
                  </label>
                  </div>
                  <br></br>
                  <hr className="mb-4" />
                  {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="submit" 
                  className="bg-red-500 text-white px-8 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'CREATE'}
                </button>
                <button 
                  type="button" 
                  className="bg-gray-200 px-8 py-2 rounded"
                  onClick={() => router.push('/couponlist')}
                >
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