"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponEdit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    product: "",
    price: "",
    discount: "",
    limit: "",
    customerEligibility: "new user",
    description: "",
    oneTimeUse: false,
    couponStatus: "active",
    startDate: "",
    endDate: ""
  });

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
        
        // Map API status to form status
        let couponStatus = "active";
        if (coupon.status === "Inactive") couponStatus = "inactive";
        if (coupon.status === "Future Plan") couponStatus = "future plan";
        
        setFormData({
          code: coupon.code || "",
          product: coupon.product || "",
          price: coupon.price || "",
          discount: coupon.discount || "",
          limit: coupon.limit || "",
          customerEligibility: coupon.customerEligibility || "new user",
          description: coupon.description || "",
          oneTimeUse: coupon.oneTimeUse || false,
          couponStatus,
          startDate: coupon.startDate || "",
          endDate: coupon.endDate || ""
        });
        
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error('Error fetching coupon:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, [couponId]);

  // Auto-update coupon status based on dates
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const currentDate = new Date();
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Reset time to compare only dates
      currentDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      let newStatus: "active" | "inactive" | "future plan";
      
      if (currentDate < startDate) {
        newStatus = "future plan";
      } else if (currentDate > endDate) {
        newStatus = "inactive";
      } else {
        newStatus = "active";
      }
      
      if (formData.couponStatus !== newStatus) {
        setFormData(prev => ({ ...prev, couponStatus: newStatus }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const currentEndDate = formData.endDate;
    
    // If there's an end date and it's before the new start date, clear it
    if (currentEndDate && newStartDate && currentEndDate < newStartDate) {
      setFormData({ 
        ...formData, 
        startDate: newStartDate, 
        endDate: "" 
      });
    } else {
      setFormData({ ...formData, startDate: newStartDate });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, endDate: e.target.value });
  };

  // Handle form submission
  interface FormData {
    code: string;
    product: string;
    price: string;
    discount: string;
    limit: string;
    customerEligibility: "new user" | "loyalty customers" | "all";
    description: string;
    oneTimeUse: boolean;
    couponStatus: "active" | "inactive" | "future plan";
    startDate: string;
    endDate: string;
  }

  interface StatusMap {
    [key: string]: string;
  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      // Map form status values to API expected format
      const statusMap: StatusMap = {
        "active": "Active",
        "inactive": "Inactive",
        "future plan": "Future Plan"
      };
      
      const couponData = {
        ...formData,
        status: statusMap[formData.couponStatus] || formData.couponStatus
      };
      
      // Send the data to the API
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update coupon');
      }
      
      alert('Coupon updated successfully!');
      router.push('/admin/couponlist');    } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error('Error updating coupon:', err);
        } else {
          setError('An unknown error occurred');
          console.error('Unknown error:', err);
        }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete coupon');
      }
      
      alert('Coupon deleted successfully!');
      router.push('/admin/couponlist');    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        console.error('Error deleting coupon:', err);
      } else {
        setError('An unknown error occurred');
        console.error('Unknown error:', err);
      }
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-xl font-semibold">Coupons Edit</h1>
            <p className="text-sm text-gray-500">Home &gt; Coupons &gt; Edit</p>
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
                  <p className="text-sm text-gray-500 mb-2">
                    The coupon status will be automatically determined based on the selected dates:
                  </p>
                  <ul className="list-disc list-inside mb-4 text-sm text-gray-500">
                    <li>Active: Current date is between start and end date</li>
                    <li>Future Plan: Current date is before start date</li>
                    <li>Inactive: Current date is after end date</li>
                  </ul>
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
                    <span className={formData.couponStatus === "active" ? "text-green-600 font-medium" : ""}>
                      Active
                    </span>
                    </label>
                  <label className="flex items-center gap-2">
                    <input
                    type="radio"
                    value="inactive"
                    checked={formData.couponStatus === "inactive"}
                    onChange={() => setFormData({ ...formData, couponStatus: "inactive" })}
                    className="w-4 h-4"
                    />
                    <span className={formData.couponStatus === "inactive" ? "text-red-600 font-medium" : ""}>
                      Inactive
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                    type="radio"
                    value="future plan"
                    checked={formData.couponStatus === "future plan"}
                    onChange={() => setFormData({ ...formData, couponStatus: "future plan" })}
                    className="w-4 h-4"
                    />
                    <span className={formData.couponStatus === "future plan" ? "text-blue-600 font-medium" : ""}>
                      Future Plan
                    </span>
                  </label>
                  </div>
                  {formData.startDate && formData.endDate && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-700">
                        Status automatically updated based on selected dates
                      </p>
                    </div>
                  )}
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
                    onChange={handleStartDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Start date cannot be in the past
                  </p>
                  </div>
                  <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input 
                    type="date" 
                    className="block w-full border border-gray-300 p-2 rounded-xl" 
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    min={formData.startDate || undefined}
                  />
                  {formData.startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      End date cannot be earlier than {new Date(formData.startDate).toLocaleDateString()}
                    </p>
                  )}
                  </div>
                </div>
                </div>

              {/* Right Column */}
              <div className="col-span-3">
                
                {/* Coupon Information and Customer Eligibility */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
                  <h2 className="text-md font-medium mb-4">Coupon Information</h2>
                  <hr className="mb-4" />                  <div className="mb-4 flex items-center gap-4">
                  <div className="pl-10">
                    <label className="block text-sm mb-1 pr-10">Coupon Code</label>
                    <input
                    type="text"
                    placeholder="Code Enter"
                    className="block w-full border border-gray-300 p-2 rounded-xl"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                className="bg-gray-200 px-8 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'UPDATE'}
              </button>
              <button 
                type="button" 
                className="bg-red-500 text-white px-8 py-2 rounded"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'DELETE'}
              </button>
              <button 
                type="button" 
                className="bg-white border border-gray-300 px-8 py-2 rounded"
                onClick={() => router.push('/admin/couponlist')}
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