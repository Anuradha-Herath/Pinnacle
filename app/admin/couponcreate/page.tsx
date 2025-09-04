"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";

export default function CouponCreate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
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
    couponType: "percentage" | "fixed_amount" | "product_based" | "first_time_buyer";
    fixedAmount: string;
    minOrderValue: string;
    productId: string;
    categoryId: string;
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
    couponType: "percentage",
    fixedAmount: "",
    minOrderValue: "",
    productId: "",
    categoryId: "",
  });

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products || []);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Auto-set customer eligibility for first-time buyer coupons
  useEffect(() => {
    if (formData.couponType === "first_time_buyer") {
      setFormData(prev => ({ ...prev, customerEligibility: "new user" }));
    }
  }, [formData.couponType]);

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
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Map form status values to API expected format
      const statusMap = {
        "active": "Active",
        "inactive": "Inactive",
        "future plan": "Future Plan"
      };
      
      // Prepare coupon data based on coupon type
      const couponData: any = {
        code: formData.code,
        description: formData.description,
        limit: formData.limit || "1",
        customerEligibility: formData.customerEligibility,
        oneTimeUse: formData.oneTimeUse,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: statusMap[formData.couponStatus] || formData.couponStatus,
        couponType: formData.couponType,
        // Required fields for backward compatibility
        product: "General", // Default product name
        price: "0", // Default price
      };

      // Add type-specific fields
      switch (formData.couponType) {
        case "percentage":
          couponData.discount = formData.discount;
          couponData.discountType = "percentage";
          couponData.product = "Percentage Discount Coupon";
          couponData.price = formData.minOrderValue || "0";
          if (formData.minOrderValue) {
            couponData.minOrderValue = formData.minOrderValue;
          }
          break;
        case "fixed_amount":
          couponData.fixedAmount = formData.fixedAmount;
          couponData.discountType = "fixed_amount";
          couponData.product = "Fixed Amount Discount Coupon";
          couponData.price = formData.minOrderValue || "0";
          if (formData.minOrderValue) {
            couponData.minOrderValue = formData.minOrderValue;
          }
          break;
        case "product_based":
          couponData.productId = formData.productId;
          couponData.discount = formData.discount;
          couponData.discountType = "product_based";
          // Find selected product name for the product field
          const selectedProduct = products.find(p => p._id === formData.productId);
          couponData.product = selectedProduct ? selectedProduct.productName : "Product-Based Coupon";
          couponData.price = selectedProduct ? (selectedProduct.regularPrice || "0") : "0";
          break;
        case "first_time_buyer":
          couponData.discount = formData.discount;
          couponData.discountType = "first_time_buyer";
          couponData.customerEligibility = "new user";
          couponData.product = "First Time Buyer Coupon";
          couponData.price = formData.minOrderValue || "0";
          if (formData.minOrderValue) {
            couponData.minOrderValue = formData.minOrderValue;
          }
          break;
      }
      
      // Remove any undefined or null values
      Object.keys(couponData).forEach(key => {
        if (couponData[key] === undefined || couponData[key] === null || couponData[key] === "") {
          delete couponData[key];
        }
      });
      
      console.log('Submitting coupon data:', couponData); // Debug log
      
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
      router.push('/admin/couponlist');
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
                
                {/* Date Schedule */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
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
                    required
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
                    required
                  />
                  {formData.startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      End date cannot be earlier than {new Date(formData.startDate).toLocaleDateString()}
                    </p>
                  )}
                  </div>
                </div>
                
                {/* Coupon Type */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                  <h2 className="text-md font-medium mb-4">Coupon Type</h2>
                  <hr className="mb-4" />
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="percentage"
                        checked={formData.couponType === "percentage"}
                        onChange={() => setFormData({ ...formData, couponType: "percentage" })}
                        className="w-4 h-4"
                      />
                      <span>Percentage Discount</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="fixed_amount"
                        checked={formData.couponType === "fixed_amount"}
                        onChange={() => setFormData({ ...formData, couponType: "fixed_amount" })}
                        className="w-4 h-4"
                      />
                      <span>Fixed Amount Discount</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="product_based"
                        checked={formData.couponType === "product_based"}
                        onChange={() => setFormData({ ...formData, couponType: "product_based" })}
                        className="w-4 h-4"
                      />
                      <span>Product Based Discount</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="first_time_buyer"
                        checked={formData.couponType === "first_time_buyer"}
                        onChange={() => setFormData({ ...formData, couponType: "first_time_buyer" })}
                        className="w-4 h-4"
                      />
                      <span>First Time Buyer</span>
                    </label>
                  </div>
                </div>
                </div>

              {/* Right Column */}
              <div className="col-span-3">
                
                {/* Coupon Information and Customer Eligibility */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-2xl mx-auto">
                  <h2 className="text-md font-medium mb-4">Coupon Information</h2>
                  <hr className="mb-4" />
                  <div className="mb-4">
                    <div className="pl-10">
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
                  </div>
                  
                  {/* Dynamic fields based on coupon type */}
                  {formData.couponType === "percentage" && (
                    <div className="mb-4 flex items-center gap-4">
                      <div>
                        <label className="block text-sm mb-1">Minimum Order Value</label>
                        <input
                          type="number"
                          placeholder="Enter minimum order value"
                          className="block w-full border border-gray-300 p-2 rounded-xl"
                          value={formData.minOrderValue}
                          onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Discount Percentage (%)</label>
                        <input
                          type="number"
                          placeholder="Enter discount percentage"
                          className="block w-full border border-gray-300 p-2 rounded-xl"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                          required
                          max="100"
                          min="1"
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.couponType === "fixed_amount" && (
                    <div className="mb-4 flex items-center gap-4">
                      <div>
                        <label className="block text-sm mb-1">Fixed Discount Amount</label>
                        <input
                          type="number"
                          placeholder="Enter fixed amount"
                          className="block w-full border border-gray-300 p-2 rounded-xl"
                          value={formData.fixedAmount}
                          onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Minimum Order Value</label>
                        <input
                          type="number"
                          placeholder="Enter minimum order value"
                          className="block w-full border border-gray-300 p-2 rounded-xl"
                          value={formData.minOrderValue}
                          onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.couponType === "product_based" && (
                    <div className="mb-4">
                      <div className="mb-4">
                        <label className="block text-sm mb-1">Select Product</label>
                        <select
                          className="block w-full border border-gray-300 p-2 rounded-xl"
                          value={formData.productId}
                          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                          required
                        >
                          <option value="">
                            {dataLoading ? "Loading products..." : "Choose a product"}
                          </option>
                          {!dataLoading && products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.productName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm mb-1">Discount Percentage (%)</label>
                          <input
                            type="number"
                            placeholder="Enter discount percentage"
                            className="block w-full border border-gray-300 p-2 rounded-xl"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            required
                            max="100"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Minimum Quantity</label>
                          <input
                            type="number"
                            placeholder="Min quantity required"
                            className="block w-full border border-gray-300 p-2 rounded-xl"
                            value={formData.limit}
                            onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formData.couponType === "first_time_buyer" && (
                    <div className="mb-4">
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          This coupon will only be available for customers making their first purchase.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm mb-1">Discount Percentage (%)</label>
                          <input
                            type="number"
                            placeholder="Enter discount percentage"
                            className="block w-full border border-gray-300 p-2 rounded-xl"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                            required
                            max="50"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Minimum Order Value</label>
                          <input
                            type="number"
                            placeholder="Enter minimum order value"
                            className="block w-full border border-gray-300 p-2 rounded-xl"
                            value={formData.minOrderValue}
                            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formData.couponType !== "product_based" && (
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Coupon Limits</label>
                      <input
                        type="number"
                        placeholder="Number of times this coupon can be used"
                        className="block w-1/3 border border-gray-300 p-2 rounded-xl"
                        value={formData.limit}
                        onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                        min="1"
                      />
                    </div>
                  )}
                  
                  <h2 className="text-md font-medium mb-4">Customer Eligibility</h2>
                  {formData.couponType === "first_time_buyer" ? (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                      <p className="text-sm text-yellow-700">
                        Customer eligibility is automatically set to "New Users Only" for first-time buyer coupons.
                      </p>
                    </div>
                  ) : (
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
                  )}
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