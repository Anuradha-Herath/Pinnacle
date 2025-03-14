"use client";

import { useState, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

export default function DiscountView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountId = searchParams?.get("id");

  // State to hold the discount details
  const [discountDetails, setDiscountDetails] = useState({
    id: "",
    product: "",
    type: "",
    percentage: "",
    startDate: "",
    endDate: "",
    status: "",
    description: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!discountId) {
      setError("No discount ID provided");
      setLoading(false);
      return;
    }

    const fetchDiscountDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/discounts/${discountId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.discount) {
          setDiscountDetails({
            id: data.discount._id || discountId,
            product: data.discount.product || "",
            type: data.discount.type || "",
            percentage: data.discount.percentage || "",
            startDate: data.discount.startDate || "",
            endDate: data.discount.endDate || "",
            status: data.discount.status || "",
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

  const handleReturn = () => {
    router.push("/discountlist");
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
          {/* ...existing code... */}
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Breadcrumb */}
          <div className="mb-6 flex justify-between">
            <div>
              <h1 className="text-xl font-semibold">Discount Details</h1>
              <p className="text-sm text-gray-500">Home &gt; Discounts &gt; {discountDetails.id}</p>
            </div>
            <button 
              onClick={handleReturn}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Back to List
            </button>
          </div>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-6">
              {/* Left Column - Status and Date Info */}
              <div className="col-span-2">
                {/* Discount Status */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h2 className="text-lg font-medium mb-4">Discount Status</h2>
                  <hr className="mb-6" />
                  <div className="flex items-center mb-2">
                    <span 
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                        discountDetails.status === "Active" 
                          ? "bg-green-300 text-green-800" 
                          : "bg-orange-300 text-orange-800"
                      }`}
                    >
                      {discountDetails.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-4">
                    This discount is currently <span className="font-medium">{discountDetails.status}</span>.
                  </p>
                </div>

                {/* Date Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Date Schedule</h2>
                  <hr className="mb-6" />
                  <div className="mb-6">
                    <p className="text-gray-500 mb-1">Start Date</p>
                    <p className="text-lg font-medium">{discountDetails.startDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">End Date</p>
                    <p className="text-lg font-medium">{discountDetails.endDate}</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Discount Details */}
              <div className="col-span-3">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-medium mb-4">Discount Information</h2>
                  <hr className="mb-6" />
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-500 mb-1">Discount ID</p>
                      <p className="text-lg font-medium">{discountDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Discount Type</p>
                      <p className="text-lg font-medium">{discountDetails.type}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-500 mb-1">Product/Category Name</p>
                    <p className="text-lg font-medium">{discountDetails.product}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-500 mb-1">Discount Percentage</p>
                    <p className="text-lg font-medium">{discountDetails.percentage}%</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-500 mb-1">Description</p>
                    <p className="text-md">
                      {discountDetails.description || "No description available."}
                    </p>
                  </div>
                  
                  <hr className="my-6" />
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => router.push(`/discountedit?id=${discountDetails.id}`)}
                      className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                    >
                      Edit Discount
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                    >
                      Delete
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
