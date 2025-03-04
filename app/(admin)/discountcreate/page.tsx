"use client";

import { useState } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter } from "next/navigation";

export default function DiscountCreate() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    discountStatus: "active",
    startDate: "",
    endDate: "",
    discountType: "category",
    productId: "",
    discountPercentage: "",
    description: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create discount');
      }
      
      // Success! Redirect to discount list
      router.push('/discountlist');
    } catch (err) {
      console.error("Error creating discount:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

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
                  <input 
                    type="date" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required 
                  />
                  <label className="block text-sm mt-4 mb-1">End Date</label>
                  <input 
                    type="date" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                    required
                  />
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
                  <input 
                    type="text" 
                    placeholder="Enter ID" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.productId} 
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })} 
                    required
                  />
                  
                  <label className="block text-sm mt-4 mb-1">Discount Percentage</label>
                  <input 
                    type="number" 
                    placeholder="Discount %" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.discountPercentage} 
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} 
                    required
                  />
                  
                  <label className="block text-sm mt-4 mb-1">Description (optional)</label>
                  <textarea 
                    placeholder="Add description" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                type="submit" 
                className="bg-red-500 text-white px-8 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'CREATING...' : 'CREATE'}
              </button>
              <button 
                type="button" 
                className="bg-gray-200 px-8 py-2 rounded"
                onClick={() => router.push('/discountlist')}
                disabled={loading}
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
