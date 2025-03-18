"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  BellIcon, 
  Cog6ToothIcon, 
  ClockIcon, 
  PlusIcon, 
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from "@heroicons/react/24/solid";
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
    createdAt?: string;
  }

  interface ItemDetails {
    id: string;
    name: string;
    image: string;
  }

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [expiredDiscounts, setExpiredDiscounts] = useState(0);
  const [futurePlanDiscounts, setFuturePlanDiscounts] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("This Month");
  
  const parseDate = (dateString: string) => {
    try {
      // Try to parse the date string directly
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error(`Invalid date: ${dateString}`);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error(`Error parsing date: ${dateString}`, error);
      return null;
    }
  };

  // New state to store product/category details
  const [itemDetails, setItemDetails] = useState<Record<string, ItemDetails>>({});

  useEffect(() => {
    // Fetch discounts from API
    const fetchDiscounts = async () => {
      try {
        console.log("Fetching discounts...");
        const response = await fetch('/api/discounts');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          throw new Error(`Failed to fetch discounts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Received discount data:", data);
        
        const fetchedDiscounts = data.discounts || [];
        setDiscounts(fetchedDiscounts);
        setFilteredDiscounts(fetchedDiscounts);
        
        // Calculate discount counts
        const active: number = fetchedDiscounts.filter((d: Discount) => d.status === "Active").length;
        const inactive: number = fetchedDiscounts.filter((d: Discount) => d.status === "Inactive").length;
        const futurePlan: number = fetchedDiscounts.filter((d: Discount) => d.status === "Future Plan").length;
        
        setActiveDiscounts(active);
        setExpiredDiscounts(inactive);
        setFuturePlanDiscounts(futurePlan);
      } catch (err) {
        console.error("Error details:", err);
        setError(err instanceof Error ? err.message : "Failed to load discounts");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  // Fetch product or category details for the discounts
  useEffect(() => {
    if (discounts.length === 0) return;
    
    const fetchItemDetails = async () => {
      const detailsMap: Record<string, ItemDetails> = {};
      
      for (const discount of discounts) {
        try {
          if (discount.type === 'Product') {
            // Fetch product details
            const response = await fetch(`/api/products/${discount.product}`);
            if (response.ok) {
              const data = await response.json();
              if (data.product) {
                const galleryImage = data.product.gallery && data.product.gallery.length > 0
                  ? data.product.gallery[0].src
                  : "/placeholder.png";
                  
                detailsMap[discount.product] = {
                  id: data.product._id,
                  name: data.product.productName,
                  image: galleryImage
                };
              }
            }
          } else if (discount.type === 'Category') {
            // Fetch category details
            const response = await fetch(`/api/categories/${discount.product}`);
            if (response.ok) {
              const data = await response.json();
              if (data.category) {
                detailsMap[discount.product] = {
                  id: data.category._id,
                  name: data.category.title,
                  image: data.category.thumbnailImage || "/placeholder.png"
                };
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching details for ${discount.type} ${discount.product}:`, err);
        }
      }
      
      setItemDetails(detailsMap);
    };
    
    fetchItemDetails();
  }, [discounts]);

  // Apply filter when status filter changes
  useEffect(() => {
    if (statusFilter) {
      setFilteredDiscounts(discounts.filter(discount => discount.status === statusFilter));
    } else {
      setFilteredDiscounts(discounts);
    }
  }, [statusFilter, discounts]);

  const handleFilterByStatus = (status: string | null) => {
    // If clicking the same filter again, clear the filter
    if (status === statusFilter) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  // Function to determine card style based on active filter
  const getCardStyle = (cardStatus: string | null) => {
    const baseStyle = "bg-white p-6 rounded-lg shadow-lg flex justify-between items-center cursor-pointer transition-all duration-200";
    if (statusFilter === cardStatus) {
      return `${baseStyle} border-2 border-orange-500 transform scale-105`;
    }
    return `${baseStyle} hover:bg-orange-50`;
  };


  // Apply filter function with improved date handling
  const applyFilter = (discountList: Discount[], filter: string) => {
    setCurrentFilter(filter);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    console.log(`Applying filter: ${filter}`);
    console.log(`Total discounts before filtering: ${discountList.length}`);
    
    let filtered: Discount[] = [];
    
    switch(filter) {
      case "This Month":
        // Filter discounts with start date in current month
        filtered = discountList.filter(discount => {
          const startDate = parseDate(discount.startDate);
          if (!startDate) return false;
          
          const isThisMonth = startDate.getMonth() === currentMonth && 
                             startDate.getFullYear() === currentYear;
                             
          if (isThisMonth) {
            console.log(`Matching discount (This Month): ${discount.product}, Date: ${discount.startDate}`);
          }
          
          return isThisMonth;
        });
        break;
        
      case "Last Month":
        // Last month calculation
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Filter discounts with start date in last month
        filtered = discountList.filter(discount => {
          const startDate = parseDate(discount.startDate);
          if (!startDate) return false;
          
          const isLastMonth = startDate.getMonth() === lastMonth && 
                             startDate.getFullYear() === lastMonthYear;
          
          if (isLastMonth) {
            console.log(`Matching discount (Last Month): ${discount.product}, Date: ${discount.startDate}`);
          }
          
          return isLastMonth;
        });
        break;
        
      case "Last 3 Months":
        // Calculate date 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        // Filter discounts created within last 3 months
        filtered = discountList.filter(discount => {
          // Use createdAt if available, otherwise fall back to startDate
          const dateField = discount.createdAt || discount.startDate;
          const creationDate = parseDate(dateField);
          
          if (!creationDate) return false;
          
          const isWithinLast3Months = creationDate >= threeMonthsAgo && creationDate <= now;
          
          if (isWithinLast3Months) {
            console.log(`Matching discount (Last 3 Months): ${discount.product}, Creation Date: ${dateField}`);
          }
          
          return isWithinLast3Months;
        });
        break;
        
      default:
        filtered = discountList;
    }
    
    console.log(`Filtered discounts count: ${filtered.length}`);
    setFilteredDiscounts(filtered);
  };

  // Function to handle filter selection
  const handleFilterSelect = (filter: string) => {
    applyFilter(discounts, filter);
    setShowDropdown(false);
  };


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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            {statusFilter && (
              <button 
                onClick={() => setStatusFilter(null)}
                className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-md mr-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Clear Filter: {statusFilter}
              </button>
            )}
          </div>
          <button 
            onClick={() => router.push("/discountcreate")} 
            className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" /> Create a Discount
          </button>
        </div>

        {/* Discount Stats - Updated to include Future Plans with icons and clickable functionality */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div 
            className={getCardStyle("Active")}
            onClick={() => handleFilterByStatus("Active")}
          >
            <div>
              <p className="text-gray-700 text-lg font-semibold">Active Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">{activeDiscounts}</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
          
          <div 
            className={getCardStyle("Inactive")}
            onClick={() => handleFilterByStatus("Inactive")}
          >
            <div>
              <p className="text-gray-700 text-lg font-semibold">Expired Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">{expiredDiscounts}</p>
            </div>
            <XCircleIcon className="h-10 w-10 text-red-500" />
          </div>
          
          <div 
            className={getCardStyle("Future Plan")}
            onClick={() => handleFilterByStatus("Future Plan")}
          >
            <div>
              <p className="text-gray-700 text-lg font-semibold">Future Plan Discounts</p>
              <p className="text-gray-900 text-2xl font-bold">{futurePlanDiscounts}</p>
            </div>
            <CalendarIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        {/* Discount Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-gray-600 font-semibold">
              All Discount List 
              <span className="text-sm ml-2 text-gray-500">
                ({filteredDiscounts.length} of {discounts.length} total)
              </span>
            </h2>
            <div className="relative">
              <button 
                className="w-40 py-2 border rounded-lg text-gray-600" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {currentFilter} ▼
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
                  <button onClick={() => handleFilterSelect("This Month")} className="w-full py-2 text-gray-600 hover:bg-gray-100">This Month</button>
                  <button onClick={() => handleFilterSelect("Last Month")} className="w-full py-2 text-gray-600 hover:bg-gray-100">Last Month</button>
                  <button onClick={() => handleFilterSelect("Last 3 Months")} className="w-full py-2 text-gray-600 hover:bg-gray-100">Last 3 Months</button>
                </div>
              )}
            </div>
          </div>

          
          <table className="w-full border-collapse text-gray-600">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="p-3">Product/Category</th>
                <th className="p-3">Discount Type</th>
                <th className="p-3">Percentage</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount) => (
                  <tr key={discount._id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center">
                        {/* Display image and name if available, fallback to ID */}
                        {itemDetails[discount.product] ? (
                          <>
                            <div className="h-10 w-10 relative mr-3 overflow-hidden rounded">
                              <img
                                src={itemDetails[discount.product].image}
                                alt={itemDetails[discount.product].name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium">{itemDetails[discount.product].name}</span>
                          </>
                        ) : (
                          <span>{discount.product}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{discount.type}</td>
                    <td className="p-3">{discount.percentage}%</td>
                    <td className="p-3">{discount.startDate}</td>
                    <td className="p-3">{discount.endDate}</td>
                    <td className="p-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold 
                        ${discount.status === "Active" ? "bg-green-300 text-green-800" : 
                          discount.status === "Future Plan" ? "bg-blue-300 text-blue-800" : 
                          "bg-orange-300 text-orange-800"}`}>
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
                    ) : statusFilter ? (
                      <p>No {statusFilter} discounts found.</p>
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
