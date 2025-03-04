"use client";

import { useState, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

export default function DiscountEdit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountId = searchParams?.get("id");

  const [formData, setFormData] = useState({
    productId: "",
    discountPercentage: "",
    discountType: "Category",
    discountStatus: "active",
    startDate: "",
    endDate: "",
    description: ""
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!discountId) {
      setError("No discount ID provided");
      setLoading(false);
      return;
    }

    const fetchDiscountDetails = async () => {
      try {
        const response = await fetch(`/api/discounts/${discountId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.discount) {
          setFormData({
            productId: data.discount.product || "",
            discountPercentage: data.discount.percentage || "",
            discountType: data.discount.type || "Category",
            discountStatus: data.discount.status.toLowerCase() || "active",
            startDate: data.discount.startDate || "",
            endDate: data.discount.endDate || "",
            description: data.discount.description || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch discount details:", err);
        setError("Failed to load discount details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountDetails();
  }, [discountId]);

  const handleRadioChange = (type: string) => {
    setFormData((prevState) => ({
      ...prevState,
      discountType: type
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this discount?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }
      
      router.push('/discountlist');
    } catch (err) {
      console.error("Error deleting discount:", err);
      alert("Failed to delete discount. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update discount');
      }
      
      router.push('/discountlist');
    } catch (err) {
      console.error("Error updating discount:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <p className="text-xl">Loading discount details...</p>
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
            <h1 className="text-xl font-semibold">Edit Discount</h1>
            <p className="text-sm text-gray-500">Home &gt; Discounts &gt; Edit</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

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
                        checked={formData.discountStatus === "active"}
                        onChange={() => setFormData({ ...formData, discountStatus: "active" })}
                        className="w-3 h-3"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.discountStatus === "inactive"}
                        onChange={() => setFormData({ ...formData, discountStatus: "inactive" })}
                        className="w-4 h-4"
                      />
                      <span>Inactive</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="future plan"
                        checked={formData.discountStatus === "future plan"}
                        onChange={() => setFormData({ ...formData, discountStatus: "future plan" })}
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
                {/* Discount Information */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
                  <h2 className="text-md font-medium mb-4">Discount Information</h2>
                  <hr className="mb-4" />
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Discount Type</label>
                    <div className="flex gap-4">
                      {['Category', 'Sub-category', 'Product', 'All'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="radio"
                            value={type}
                            checked={formData.discountType === type}
                            onChange={() => handleRadioChange(type)}
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
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Discount Percentage</label>
                    <input
                      type="number"
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Description (optional)</label>
                    <textarea
                      className="block w-full border border-gray-300 p-2 rounded-xl"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  
                  <hr className="mb-4" />
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-6">
                    <button 
                      type="submit" 
                      className="bg-blue-500 text-white px-8 py-2 rounded" 
                      disabled={submitting}
                    >
                      {submitting ? "UPDATING..." : "UPDATE"}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleDelete}
                      className="bg-red-500 text-white px-8 py-2 rounded"
                    >
                      DELETE
                    </button>
                    <button 
                      type="button" 
                      className="bg-gray-200 px-8 py-2 rounded" 
                      onClick={() => router.push('/discountlist')}
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
