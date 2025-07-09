"use client";

import { useState, useEffect, Suspense } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

interface ItemDetails {
  id: string;
  name: string;
  image: string;
  price?: number; // Add price field
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
        <p className="mt-2">Loading discount details...</p>
      </div>
    </div>
  );
}

// Create a separate component that uses useSearchParams
function DiscountViewContent() {
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
  
  // State to hold product/category details
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // All the same component logic and effects...
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
          const discount = data.discount;
          setDiscountDetails({
            id: discount._id || discountId,
            product: discount.product || "",
            type: discount.type || "",
            percentage: discount.percentage || "",
            startDate: discount.startDate || "",
            endDate: discount.endDate || "",
            status: discount.status || "",
            description: discount.description || ""
          });
          
          // Fetch product or category details
          if (discount.type === "Product") {
            const productResponse = await fetch(`/api/products/${discount.product}`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              if (productData.product) {
                const galleryImage = productData.product.gallery && productData.product.gallery.length > 0
                  ? productData.product.gallery[0].src
                  : "/placeholder.png";
                
                setItemDetails({
                  id: productData.product._id,
                  name: productData.product.productName,
                  image: galleryImage,
                  price: productData.product.regularPrice // Store the price
                });
              }
            }
          } else if (discount.type === "Category") {
            const categoryResponse = await fetch(`/api/categories/${discount.product}`);
            if (categoryResponse.ok) {
              const categoryData = await categoryResponse.json();
              if (categoryData.category) {
                setItemDetails({
                  id: categoryData.category._id,
                  name: categoryData.category.title,
                  image: categoryData.category.thumbnailImage || "/placeholder.png"
                });
              }
            }
          }
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

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!itemDetails?.price || !discountDetails.percentage) {
      return null;
    }
    
    const originalPrice = itemDetails.price;
    const discountPercentage = parseFloat(discountDetails.percentage.toString());
    const discountAmount = (originalPrice * discountPercentage) / 100;
    const discountedPrice = originalPrice - discountAmount;
    
    return {
      originalPrice: originalPrice.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      savedAmount: discountAmount.toFixed(2)
    };
  };
  
  // Get pricing information if available
  const priceInfo = discountDetails.type === 'Product' && itemDetails?.price ? calculateDiscountedPrice() : null;

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
      
      router.push('/admin/discountlist');
    } catch (err) {
      console.error("Error deleting discount:", err);
      alert("Failed to delete discount. Please try again.");
    }
  };

  const handleReturn = () => {
    router.push("/admin/discountlist");
  };

  if (loading) {
    return (
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-2">Loading discount details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => router.push('/admin/discountlist')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Back to Discount List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Return your main content
  return (
    <div className="flex-1">
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Breadcrumb - removed Back button */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Discount Details</h1>
          <p className="text-sm text-gray-500">Home &gt; Discounts &gt; View</p>
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
                        : discountDetails.status === "Future Plan"
                        ? "bg-blue-300 text-blue-800"
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
                  <p className="text-gray-500 mb-1">{discountDetails.type} Details</p>
                  <div className="flex items-center mt-2">
                    {itemDetails ? (
                      <>
                        <div className="h-16 w-16 relative mr-4 overflow-hidden rounded-lg">
                          <img
                            src={itemDetails.image}
                            alt={itemDetails.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-lg font-medium">{itemDetails.name}</p>
                          <p className="text-sm text-gray-500">ID: {itemDetails.id}</p>
                          {itemDetails.price && (
                            <p className="text-sm font-medium text-gray-700">
                              Original Price: ${itemDetails.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-lg font-medium">{discountDetails.product}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-500 mb-1">Discount Percentage</p>
                  <p className="text-lg font-medium">{discountDetails.percentage}%</p>
                </div>
                
                {/* Display price breakdown for single products */}
                {discountDetails.type === 'Product' && priceInfo && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-800 mb-3">Price Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Original Price:</p>
                        <p className="text-lg font-medium">${priceInfo.originalPrice}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Discounted Price:</p>
                        <p className="text-lg font-medium text-green-600">${priceInfo.discountedPrice}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Customer Savings:</p>
                        <p className="text-lg font-medium text-red-600">
                          ${priceInfo.savedAmount} ({discountDetails.percentage}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                    onClick={() => router.push(`/admin/discountedit?id=${discountDetails.id}`)}
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
                  <button 
                    onClick={handleReturn}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main page component that wraps the form in Suspense
export default function DiscountView() {
  return (
    <div className="flex">
      <Sidebar />
      <Suspense fallback={<LoadingFallback />}>
        <DiscountViewContent />
      </Suspense>
    </div>
  );
}
