"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  interface CouponData {
    status: string;
    startDate: string;
    endDate: string;
    code: string;
    product: string;
    price: string;
    discount: string;
    limit?: string;
    customerEligibility?: string;
    description?: string;
    oneTimeUse: boolean;
  }
  
  const [couponData, setCouponData] = useState<CouponData | null>(null);

  // Fetch coupon data on page load
  useEffect(() => {
    if (!couponId) {
      setError("No coupon ID provided");
      setLoading(false);
      return;
    }

    const fetchCouponData = async () => {
      try {
        const response = await fetch(`/api/coupons/${couponId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch coupon data');
        }
        
        const { coupon } = await response.json();
        setCouponData(coupon);
        
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching coupon:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, [couponId]);

  const handleEdit = () => {
    router.push(`/couponedit?id=${couponId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div>Loading coupon data...</div>
        </div>
      </div>
    );
  }

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

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          {couponData && (
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="col-span-2 ">
                {/* Coupon Status */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Coupon Status</h2>
                  <hr className="mb-4" />
                  <div className="p-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        couponData.status === "Future"
                          ? "bg-blue-300 text-blue-800"
                          : couponData.status === "Active"
                          ? "bg-green-300 text-green-800"
                          : couponData.status === "Expired" || couponData.status === "Inactive"
                          ? "bg-orange-300 text-orange-800"
                          : ""
                      }`}
                    >
                      {couponData.status}
                    </span>
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
                    <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                      {couponData.startDate}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">End Date</label>
                    <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                      {couponData.endDate}
                    </div>
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
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Coupon Code</label>
                      <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                        {couponData.code}
                      </div>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Product Name</label>
                      <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                        {couponData.product}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 flex items-center gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Price</label>
                      <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                        {couponData.price}
                      </div>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Discount</label>
                      <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50">
                        {couponData.discount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Coupon Limits</label>
                    <div className="block w-1/3 border border-gray-300 p-2 rounded-xl bg-gray-50">
                      {couponData.limit || "No limit"}
                    </div>
                  </div>
                  
                  <h2 className="text-md font-medium mb-4">Customer Eligibility</h2>
                  <div className="mb-4 p-2 border border-gray-300 rounded-xl bg-gray-50">
                    {couponData.customerEligibility || "All customers"}
                  </div>
                  
                  {couponData.description && (
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Description</label>
                      <div className="block w-full border border-gray-300 p-2 rounded-xl bg-gray-50 min-h-[80px]">
                        {couponData.description}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={couponData.oneTimeUse}
                        readOnly
                        disabled
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
                      type="button" 
                      className="bg-red-500 text-white px-8 py-2 rounded"
                      onClick={handleEdit}
                    >
                      EDIT
                    </button>
                    <button 
                      type="button" 
                      className="bg-gray-200 px-8 py-2 rounded"
                      onClick={() => router.push('/couponlist')}
                    >
                      BACK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}