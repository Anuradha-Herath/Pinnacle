"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, TrashIcon, BellIcon, Cog6ToothIcon, ClockIcon, PlusIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function DiscountList() {
  const router = useRouter();
  interface Discount {
    _id: string;
    product: string;
    type: string;
    percentage: number;
    startDate: string;
    endDate: string;
    status: string;
  }

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [expiredDiscounts, setExpiredDiscounts] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch discounts from API
    const fetchDiscounts = async () => {
      try {
        const response = await fetch('/api/discounts');
        if (!response.ok) {
          throw new Error('Failed to fetch discounts');
        }
        const data = await response.json();
        const fetchedDiscounts = data.discounts || [];
        setDiscounts(fetchedDiscounts);
        
        // Calculate discount counts
        const active: number = fetchedDiscounts.filter((d: Discount) => d.status === "Active").length;
        const inactive: number = fetchedDiscounts.filter((d: Discount) => d.status === "Inactive").length;
        
        setActiveDiscounts(active);
        setExpiredDiscounts(inactive);
      } catch (err) {
        setError("Failed to load discounts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  // Function to view discount details
  const handleViewDiscount = (discountId: string) => {
    router.push(`/discountview?id=${discountId}`);
  };

  // Function to edit discount 
  const handleEditDiscount = (discountId: string) => {
    router.push(`/discountedit?id=${discountId}`);
  };

  // Function to handle discount deletion
  const handleDeleteDiscount = async (discountId: string) => {
    // Show confirmation dialog
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
      
      // Remove the deleted discount from state to update UI
      setDiscounts(prevDiscounts => 
        prevDiscounts.filter(discount => discount._id !== discountId)
      );
      
      // Show success message (optional)
      alert("Discount deleted successfully");
      
    } catch (err) {
      console.error("Error deleting discount:", err);
      alert("Failed to delete discount. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex justify-center items-center">
          <p>Loading discounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">Discount List</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-lg"><BellIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><Cog6ToothIcon className="h-6 w-6 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-200 rounded-lg"><ClockIcon className="h-6 w-6 text-gray-600" /></button>
            <button onClick={() => router.push("/profile")} className="p-1 rounded-full border-2 border-gray-300">
              <img src="/p9.webp" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            </button>
            <input type="text" placeholder="🔍 Search" className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        {/* Add Discount Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => router.push("/discountcreate")} 
            className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" /> Create a Discount
          </button>
        </div>

        {/* Discount Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-lg flex justify-between items-center">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Active Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">{activeDiscounts}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg flex justify-between items-center">
            <div>
              <p className="text-gray-700 text-lg font-semibold">Expired Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">{expiredDiscounts}</p>
            </div>
          </div>
        </div>

        {/* Discount Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-gray-600 font-semibold">All Discount List</h2>
            <div className="relative">
                <button 
                className="w-40 py-2 border rounded-lg text-gray-600" 
                onClick={() => setShowDropdown(!showDropdown)}
                >
                This Month ▼
                </button>
                {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 justify-ce bg-white border rounded-lg shadow-lg">
                    
                    <button className="w-40 py-2 border rounded-lg text-gray-600 hover:bg-gray-100">Last Month</button>
                  <button className="w-40 py-2 border rounded-lg text-gray-600 hover:bg-gray-100">Last 3 Months</button>
                </div>
                )}
              
           </div>
          </div>
          <table className="w-full border-collapse text-gray-600">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-3">Product Name</th>
                <th className="p-3">Discount Type</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length > 0 ? (
                discounts.map((discount) => (
                  <tr key={discount._id} className="border-t">
                    <td className="p-3">{discount.product}</td>
                    <td className="p-3">{discount.type}</td>
                    <td className="p-3">{discount.percentage}</td>
                    <td className="p-3">{discount.startDate}</td>
                    <td className="p-3">{discount.endDate}</td>
                    <td className="p-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${discount.status === "Active" ? "bg-green-300 text-green-800" : "bg-orange-300 text-orange-800"}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 justify-end">
                      <button 
                        onClick={() => handleViewDiscount(discount._id)}
                        className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleEditDiscount(discount._id)}
                        className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDiscount(discount._id)}
                        className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-3 text-center">
                    {error ? (
                      <p className="text-red-500">{error}</p>
                    ) : (
                      <p>No discounts found. Create your first discount!</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-end mt-6 pr-4">
            <div className="flex items-center border rounded-md overflow-hidden shadow-md">
              <button className="px-4 py-2 border-r bg-white hover:bg-gray-200">Previous</button>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">2</button>
              <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
