"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  PlusIcon, 
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import Pagination from "@/app/components/Pagination";
import Card from "@/app/components/Card";
import DiscountTableBody from "@/app/components/DiscountTableBody";


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
  const [displayedDiscounts, setDisplayedDiscounts] = useState<Discount[]>([]); // For pagination
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [expiredDiscounts, setExpiredDiscounts] = useState(0);
  const [futurePlanDiscounts, setFuturePlanDiscounts] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("This Month");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 discounts per page
  const [totalPages, setTotalPages] = useState(1);

  // New state to store product/category details
  const [itemDetails, setItemDetails] = useState<Record<string, ItemDetails>>({});
  
  // Add a cache for product/category details to persist across page navigations
  const [itemDetailsCache, setItemDetailsCache] = useState<Record<string, ItemDetails>>(() => {
    // Try to retrieve from sessionStorage on initial load
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('discount-items-cache');
      return cached ? JSON.parse(cached) : {};
    }
    return {};
  });
  
  // Add loading state for images
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    // Save cache to sessionStorage when it updates
    if (Object.keys(itemDetailsCache).length > 0) {
      sessionStorage.setItem('discount-items-cache', JSON.stringify(itemDetailsCache));
    }
  }, [itemDetailsCache]);

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

  // Optimized fetch for product/category details - parallel fetching
  useEffect(() => {
    if (discounts.length === 0) return;
    
    const fetchItemDetails = async () => {
      // Track which items we're currently loading
      const itemsToLoad = new Set<string>();
      
      // Filter to only fetch items we don't already have in cache
      const uncachedProductIds = discounts
        .filter(discount => discount.type === 'Product' && !itemDetailsCache[discount.product])
        .map(discount => discount.product);
      
      const uncachedCategoryIds = discounts
        .filter(discount => discount.type === 'Category' && !itemDetailsCache[discount.product])
        .map(discount => discount.product);
      
      // If nothing new to fetch, exit early
      if (uncachedProductIds.length === 0 && uncachedCategoryIds.length === 0) {
        setItemDetails(itemDetailsCache);
        return;
      }
      
      // Mark all uncached items as loading
      setLoadingItems(new Set([...uncachedProductIds, ...uncachedCategoryIds]));
      
      // Fetch product details in parallel
      if (uncachedProductIds.length > 0) {
        const productPromises = uncachedProductIds.map(async (productId) => {
          try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.product) {
                const galleryImage = data.product.gallery && data.product.gallery.length > 0
                  ? data.product.gallery[0].src
                  : "/placeholder.png";
                  
                return {
                  id: productId,
                  details: {
                    id: data.product._id,
                    name: data.product.productName,
                    image: galleryImage
                  }
                };
              }
            }
            return null;
          } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
            return null;
          }
        });
        
        // Wait for all product fetches to complete
        const productResults = await Promise.all(productPromises);
        const newProductDetails = productResults
          .filter(result => result !== null)
          .reduce((acc, result) => {
            if (result) acc[result.id] = result.details;
            return acc;
          }, {} as Record<string, ItemDetails>);
          
        // Update cache with new product details
        setItemDetailsCache(prev => ({...prev, ...newProductDetails}));
      }
      
      // Fetch category details in parallel
      if (uncachedCategoryIds.length > 0) {
        const categoryPromises = uncachedCategoryIds.map(async (categoryId) => {
          try {
            const response = await fetch(`/api/categories/${categoryId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.category) {
                return {
                  id: categoryId,
                  details: {
                    id: data.category._id,
                    name: data.category.title,
                    image: data.category.thumbnailImage || "/placeholder.png"
                  }
                };
              }
            }
            return null;
          } catch (err) {
            console.error(`Error fetching category ${categoryId}:`, err);
            return null;
          }
        });
        
        // Wait for all category fetches to complete
        const categoryResults = await Promise.all(categoryPromises);
        const newCategoryDetails = categoryResults
          .filter(result => result !== null)
          .reduce((acc, result) => {
            if (result) acc[result.id] = result.details;
            return acc;
          }, {} as Record<string, ItemDetails>);
          
        // Update cache with new category details
        setItemDetailsCache(prev => ({...prev, ...newCategoryDetails}));
      }
      
      // Clear loading state
      setLoadingItems(new Set());
    };
    
    // Set itemDetails from cache immediately while we fetch new data
    setItemDetails(itemDetailsCache);
    
    // Then fetch any missing details
    fetchItemDetails();
  }, [discounts, itemDetailsCache]);

  // Apply pagination when filtered discounts or page changes
  useEffect(() => {
    applyPagination(filteredDiscounts);
    // Calculate total pages
    const total = Math.ceil(filteredDiscounts.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
  }, [currentPage, filteredDiscounts, itemsPerPage]);
  
  // Handle pagination
  const applyPagination = (items: Discount[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedDiscounts(items.slice(startIndex, endIndex));
  };
  
  // Handle pagination navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Apply filter when status filter changes
  useEffect(() => {
    if (statusFilter) {
      const filtered = discounts.filter(discount => discount.status === statusFilter);
      setFilteredDiscounts(filtered);
    } else {
      setFilteredDiscounts(discounts);
    }
    // Reset to page 1 when filter changes
    setCurrentPage(1);
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
    // Reset to page 1 when applying new filter
    setCurrentPage(1);
    setFilteredDiscounts(filtered);
  };

  // Function to handle filter selection
  const handleFilterSelect = (filter: string) => {
    applyFilter(discounts, filter);
    setShowDropdown(false);
  };


  // Function to view discount details
  const handleViewDiscount = (discountId: string) => {
    router.push(`/admin/discountview?id=${discountId}`);
  };

  // Function to edit discount 
  const handleEditDiscount = (discountId: string) => {
    router.push(`/admin/discountedit?id=${discountId}`);
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
      <div className="min-h-screen bg-gray-50 p-4 flex-1">
        <TopBar title="Discount List" />

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
            onClick={() => router.push("/admin/discountcreate")}
            className="bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" /> Create a Discount
          </button>
        </div>

        {/* Discount Stats - Updated to include Future Plans with icons and clickable functionality */}
        <div className="grid grid-cols-3 gap-6 mb-6">
            <Card
              title="Active Discounts"
              count={activeDiscounts}
              status="Active"
              activeFilter={statusFilter}
              onClick={handleFilterByStatus}
              bgColor="bg-green-100"
              textColor="green-500"
              icon={<CheckCircleIcon className="h-8 w-8 text-green-500" />}
            />
            <Card
              title="Expired Discounts"
              count={expiredDiscounts}
              status="Inactive"
              activeFilter={statusFilter}
              onClick={handleFilterByStatus}
              bgColor="bg-red-100"
              textColor="red-500"
              icon={<XCircleIcon className="h-8 w-8 text-red-500" />}
            />
            <Card
              title="Future Plan Discounts"
              count={futurePlanDiscounts}
              status="Future Plan"
              activeFilter={statusFilter}
              onClick={handleFilterByStatus}
              bgColor="bg-blue-100"
              textColor="blue-500"
              icon={<CalendarIcon className="h-8 w-8 text-blue-500" />}
            />
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
                  <button
                    onClick={() => handleFilterSelect("This Month")}
                    className="w-full py-2 text-gray-600 hover:bg-gray-100"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => handleFilterSelect("Last Month")}
                    className="w-full py-2 text-gray-600 hover:bg-gray-100"
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => handleFilterSelect("Last 3 Months")}
                    className="w-full py-2 text-gray-600 hover:bg-gray-100"
                  >
                    Last 3 Months
                  </button>
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
            <DiscountTableBody
              discounts={displayedDiscounts}
              itemDetails={itemDetails}
              loadingItems={loadingItems}
              error={error}
              statusFilter={statusFilter}
              onView={handleViewDiscount}
              onEdit={handleEditDiscount}
              onDelete={handleDeleteDiscount}
            />
          </table>

          {/* Pagination */}
          {discounts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          )}

        </div>
      </div>
    </div>
  );
}
