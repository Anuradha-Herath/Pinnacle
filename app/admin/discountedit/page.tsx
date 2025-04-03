"use client";

import { useState, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";

interface Product {
  _id: string;
  productName: string;
  gallery?: Array<{src: string, name?: string, color?: string}>;
  regularPrice?: number; // Add regularPrice to the interface
}

interface Category {
  _id: string;
  title: string;
  thumbnailImage?: string;
}

export default function DiscountEdit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discountId = searchParams?.get("id");

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    discountType: "",
    productId: "",
    categoryId: "",
    selectionMode: "single", // 'single' for product, 'category' for category
    discountPercentage: "",
    description: ""
  });

  // State variables for products and categories
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State for product search
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    if (!discountId) {
      setError("No discount ID provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch discount details
        const discountResponse = await fetch(`/api/discounts/${discountId}`);
        if (!discountResponse.ok) throw new Error(`Error: ${discountResponse.status}`);
        const discountData = await discountResponse.json();
        
        // Fetch products
        const productsResponse = await fetch('/api/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        
        setProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
        
        if (discountData.discount) {
          const discount = discountData.discount;
          const selMode = discount.type === "Product" ? "single" : "category";
          
          // Set form data
          setFormData({
            startDate: discount.startDate || "",
            endDate: discount.endDate || "",
            discountType: discount.type || "",
            productId: selMode === "single" ? discount.product : "",
            categoryId: selMode === "category" ? discount.product : "",
            selectionMode: selMode,
            discountPercentage: discount.percentage || "",
            description: discount.description || ""
          });
          
          // Find the selected product if it's a product discount
          if (selMode === "single" && discount.product) {
            const product = productsData.products?.find((p: Product) => p._id === discount.product);
            if (product) {
              setSelectedProduct(product);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load discount data. Please try again.");
      } finally {
        setLoading(false);
        setDataLoading(false);
      }
    };

    fetchData();
  }, [discountId]);

  // Filter products based on search term
  useEffect(() => {
    if (products.length === 0) return;
    
    if (productSearchTerm.trim() === "") {
      setFilteredProducts(products.slice(0, 5));
    } else {
      const filtered = products.filter(product => 
        product.productName.toLowerCase().includes(productSearchTerm.toLowerCase())
      ).slice(0, 10);
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, products]);
  
  // Set selected product when productId changes
  useEffect(() => {
    if (formData.productId && products.length > 0) {
      const product = products.find(p => p._id === formData.productId);
      setSelectedProduct(product || null);
    }
  }, [formData.productId, products]);

  const handleSelectProduct = (product: Product) => {
    setFormData({ ...formData, productId: product._id });
    setSelectedProduct(product);
    setShowProductDropdown(false);
    setProductSearchTerm("");
  };
  
  const handleProductSearchFocus = () => {
    setShowProductDropdown(true);
    if (productSearchTerm.trim() === "" && products.length > 0) {
      setFilteredProducts(products.slice(0, 5));
    }
  };

  const getProductImage = (product: Product) => {
    return product.gallery && product.gallery.length > 0 
      ? product.gallery[0].src 
      : "/placeholder.png";
  };
  
  // Calculate discount status based on dates
  const calculateDiscountStatus = (startDate: string, endDate: string): string => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) {
      return "Future Plan";
    } else if (today > end) {
      return "Inactive";
    } else {
      return "Active";
    }
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
      
      router.push('/admin/discountlist');
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
      // Calculate the status based on dates
      const discountStatus = calculateDiscountStatus(formData.startDate, formData.endDate);
      
      // Prepare submission data
      const submissionData = {
        discountStatus,
        startDate: formData.startDate,
        endDate: formData.endDate,
        discountType: formData.selectionMode === 'single' ? 'Product' : 'Category',
        productId: formData.selectionMode === 'single' ? formData.productId : formData.categoryId,
        discountPercentage: formData.discountPercentage,
        description: formData.description
      };
      
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update discount');
      }
      
      router.push('/admin/discountlist');
    } catch (err) {
      console.error("Error updating discount:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setSubmitting(false);
    }
  };

  // Calculate the discounted price based on the percentage
  const calculateDiscountedPrice = () => {
    if (!selectedProduct?.regularPrice || !formData.discountPercentage) {
      return null;
    }
    
    const originalPrice = selectedProduct.regularPrice;
    const discountPercentage = parseFloat(formData.discountPercentage);
    const discountAmount = (originalPrice * discountPercentage) / 100;
    const discountedPrice = originalPrice - discountAmount;
    
    return {
      originalPrice: originalPrice.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      savedAmount: discountAmount.toFixed(2)
    };
  };
  
  // Get pricing information if available
  const priceInfo = formData.selectionMode === 'single' ? calculateDiscountedPrice() : null;

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
      <Sidebar />
      
      <div className="flex-1">
        {/* Top Bar */}
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
              <div className="col-span-2">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-md font-medium mb-4">Date Schedule</h2>
                  <p className="text-sm text-gray-500 mb-2">
                    The discount status will be automatically determined based on these dates:
                  </p>
                  <ul className="list-disc list-inside mb-4 text-sm text-gray-500">
                    <li>Active: Current date is between start and end date</li>
                    <li>Future Plan: Current date is before start date</li>
                    <li>Inactive: Current date is after end date</li>
                  </ul>
                  
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
                  
                  {/* Selection Mode */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Apply Discount To:</h3>
                    <div className="flex gap-6 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="single"
                          checked={formData.selectionMode === "single"}
                          onChange={() => setFormData({ ...formData, selectionMode: "single", categoryId: "" })}
                        />
                        <span>Single Product</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="category"
                          checked={formData.selectionMode === "category"}
                          onChange={() => setFormData({ ...formData, selectionMode: "category", productId: "" })}
                        />
                        <span>All Products in Category</span>
                      </label>
                    </div>
                  </div>

                  {/* Product or Category Selection */}
                  {formData.selectionMode === "single" ? (
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Select Product</label>
                      {dataLoading ? (
                        <p className="text-sm text-gray-500">Loading products...</p>
                      ) : (
                        <div className="relative">
                          {/* Search input */}
                          <div className="flex items-center border rounded-xl overflow-hidden">
                            <div className="pl-3 text-gray-400">
                              <MagnifyingGlassIcon className="h-5 w-5" />
                            </div>
                            <input
                              type="text"
                              className="w-full p-2 focus:outline-none"
                              placeholder="Search products by name..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              onFocus={handleProductSearchFocus}
                            />
                          </div>

                          {/* Selected product display */}
                          {selectedProduct && (
                            <div className="mt-2 p-3 border rounded-lg flex items-center bg-gray-50">
                              <div className="h-12 w-12 relative mr-3 overflow-hidden rounded">
                                <img 
                                  src={getProductImage(selectedProduct)}
                                  alt={selectedProduct.productName}
                                  className="object-cover h-full w-full"
                                />
                              </div>
                              <div className="flex-grow">
                                <p className="font-medium">{selectedProduct.productName}</p>
                                <p className="text-sm text-gray-500">ID: {selectedProduct._id}</p>
                                {selectedProduct.regularPrice && (
                                  <p className="text-sm font-medium text-gray-700">
                                    Price: ${selectedProduct.regularPrice.toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <button 
                                type="button"
                                className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  setFormData({...formData, productId: ""});
                                  setSelectedProduct(null);
                                }}
                              >
                                Change
                              </button>
                            </div>
                          )}

                          {/* Product search results dropdown */}
                          {showProductDropdown && filteredProducts.length > 0 && !selectedProduct && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredProducts.map((product) => (
                                <div 
                                  key={product._id} 
                                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer border-b"
                                  onClick={() => handleSelectProduct(product)}
                                >
                                  <div className="h-10 w-10 relative mr-3 overflow-hidden rounded">
                                    <img 
                                      src={getProductImage(product)}
                                      alt={product.productName}
                                      className="object-cover h-full w-full"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">{product.productName}</p>
                                    <p className="text-xs text-gray-500 truncate">ID: {product._id}</p>
                                  </div>
                                </div>
                              ))}
                              {filteredProducts.length === 10 && (
                                <div className="p-2 text-center text-sm text-gray-500">
                                  Showing first 10 results. Refine your search for more options.
                                </div>
                              )}
                            </div>
                          )}
                          
                          {showProductDropdown && filteredProducts.length === 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4">
                              <p className="text-gray-500 text-center">No products found matching your search.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Select Category</label>
                      {dataLoading ? (
                        <p className="text-sm text-gray-500">Loading categories...</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {categories.map((category) => (
                            <div 
                              key={category._id}
                              className={`p-3 border rounded-lg flex items-center cursor-pointer ${
                                formData.categoryId === category._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => setFormData({ ...formData, categoryId: category._id })}
                            >
                              {category.thumbnailImage && (
                                <div className="h-10 w-10 relative mr-3 overflow-hidden rounded">
                                  <img 
                                    src={category.thumbnailImage}
                                    alt={category.title}
                                    className="object-cover h-full w-full"
                                  />
                                </div>
                              )}
                              <span className="font-medium">{category.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <label className="block text-sm mt-4 mb-1">Discount Percentage</label>
                  <input 
                    type="number" 
                    placeholder="Discount %" 
                    className="w-full border p-2 rounded-xl" 
                    value={formData.discountPercentage} 
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} 
                    required
                  />
                  
                  {/* Display price breakdown for single products */}
                  {formData.selectionMode === 'single' && selectedProduct && priceInfo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Price Breakdown</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Original Price:</p>
                          <p className="font-medium">${priceInfo.originalPrice}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Discounted Price:</p>
                          <p className="font-medium text-green-600">${priceInfo.discountedPrice}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Customer Saves:</p>
                          <p className="font-medium text-red-600">${priceInfo.savedAmount} ({formData.discountPercentage}%)</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                onClick={() => router.push('/admin/discountlist')}
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
