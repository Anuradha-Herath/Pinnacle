"use client";

import { useState, useEffect } from "react";
import { BellIcon, Cog6ToothIcon, ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Product {
  _id: string;
  productName: string;
  gallery?: Array<{ src: string; name?: string; color?: string }>;
  regularPrice?: number;
  discountedPrice?: number;
  category?: string;
  subCategory?: string;
}

interface Category {
  _id: string;
  title: string;
  thumbnailImage?: string;
}

export default function DiscountCreate() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    discountType: "product",
    productId: "",
    categoryId: "",
    selectionMode: "single",
    discountPercentage: "",
    description: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState("");
  const [singleProductResults, setSingleProductResults] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        setDataLoading(true);

        const productsResponse = await fetch("/api/products?limit=500");
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }
        const productsData = await productsResponse.json();

        const categoriesResponse = await fetch("/api/categories");
        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }
        const categoriesData = await categoriesResponse.json();

        setProducts(productsData.products || []);
        setFilteredProducts(productsData.products || []);
        setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products or categories data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    let result = [...products];

    if (formData.categoryId) {
      const selectedCategory = categories.find((c) => c._id === formData.categoryId);
      if (selectedCategory) {
        result = result.filter((product) => product.category === selectedCategory.title);
      }
    }

    if (productFilter.trim() !== "") {
      const searchTerm = productFilter.toLowerCase();
      result = result.filter((product) =>
        product.productName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredProducts(result);
  }, [formData.categoryId, productFilter, products, categories]);

  useEffect(() => {
    if (formData.productId && products.length > 0) {
      const product = products.find((p) => p._id === formData.productId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.productId, products]);

  useEffect(() => {
    if (products.length === 0) return;

    if (formData.selectionMode === "single") {
      if (productSearchTerm.trim() === "") {
        setSingleProductResults(products.slice(0, 5));
      } else {
        const filtered = products
          .filter(product =>
            product.productName.toLowerCase().includes(productSearchTerm.toLowerCase())
          )
          .slice(0, 10);
        setSingleProductResults(filtered);
      }
    }
  }, [productSearchTerm, products, formData.selectionMode]);

  const handleToggleProductSelection = (productId: string) => {
    setSelectedCategoryProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    setSelectedCategoryProducts(filteredProducts.map((product) => product._id));
  };

  const handleDeselectAllProducts = () => {
    setSelectedCategoryProducts([]);
  };

  const handleSelectProduct = (product: Product) => {
    setFormData({ ...formData, productId: product._id });
    setSelectedProduct(product);
    setShowProductDropdown(false);
    setProductSearchTerm("");
  };

  const handleProductSearchFocus = () => {
    setShowProductDropdown(true);
    if (productSearchTerm.trim() === "") {
      setSingleProductResults(products.slice(0, 5));
    }
  };

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
      savedAmount: discountAmount.toFixed(2),
    };
  };

  const priceInfo = formData.selectionMode === "single" ? calculateDiscountedPrice() : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submissionData = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        discountType: formData.selectionMode === "single" ? "Product" : "Category",
        productId:
          formData.selectionMode === "multipleProducts"
            ? selectedCategoryProducts
            : formData.selectionMode === "single"
            ? formData.productId
            : formData.categoryId,
        discountPercentage: formData.discountPercentage,
        description: formData.description,
      };

      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create discount");
      }

      router.push("/admin/discountlist");
    } catch (err) {
      console.error("Error creating discount:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
            <h1 className="text-xl font-semibold">Create Discount</h1>
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

                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Apply Discount To:</h3>
                    <div className="flex gap-6 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="single"
                          checked={formData.selectionMode === "single"}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              selectionMode: "single",
                              categoryId: "",
                            })
                          }
                        />
                        <span>Single Product</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="multipleProducts"
                          checked={formData.selectionMode === "multipleProducts"}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              selectionMode: "multipleProducts",
                              productId: "",
                            })
                          }
                        />
                        <span>Multiple Products</span>
                      </label>
                    </div>
                  </div>

                  {formData.selectionMode === "single" ? (
                    <div className="mb-4">
                      <label className="block text-sm mb-1">Select Product</label>
                      {dataLoading ? (
                        <p className="text-sm text-gray-500">Loading products...</p>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center border rounded-xl overflow-hidden">
                            <div className="pl-3 text-gray-400">
                              <MagnifyingGlassIcon className="h-5 w-5" />
                            </div>
                            <input
                              type="text"
                              className="w-full p-2 focus:outline-none"
                              placeholder="Search products by name..."
                              value={productSearchTerm}
                              onChange={(e) => {
                                setProductSearchTerm(e.target.value);
                                setShowProductDropdown(true);
                              }}
                              onFocus={handleProductSearchFocus}
                            />
                          </div>

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
                                  setFormData({ ...formData, productId: "" });
                                  setSelectedProduct(null);
                                }}
                              >
                                Change
                              </button>
                            </div>
                          )}

                          {showProductDropdown && singleProductResults.length > 0 && !selectedProduct && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {singleProductResults.map((product) => (
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
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.png';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium">{product.productName}</p>
                                    <p className="text-xs text-gray-500 truncate">ID: {product._id}</p>
                                  </div>
                                </div>
                              ))}
                              {singleProductResults.length === 10 && (
                                <div className="p-2 text-center text-sm text-gray-500">
                                  Showing first 10 results. Refine your search for more options.
                                </div>
                              )}
                            </div>
                          )}
                          
                          {showProductDropdown && singleProductResults.length === 0 && productSearchTerm.trim() !== "" && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4">
                              <p className="text-gray-500 text-center">No products found matching your search.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm mb-1">Filter by Category (Optional)</label>
                          <select
                            className="w-full p-2 border rounded-md"
                            value={formData.categoryId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                categoryId: e.target.value,
                              })
                            }
                          >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm mb-1">Search Products</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search by product name..."
                              value={productFilter}
                              onChange={(e) => setProductFilter(e.target.value)}
                              className="w-full p-2 border rounded-md pl-10"
                            />
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b">
                          <h4 className="font-medium">Select Products</h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:underline"
                              onClick={handleSelectAllProducts}
                            >
                              Select All ({filteredProducts.length})
                            </button>
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={handleDeselectAllProducts}
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {dataLoading ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-gray-600">Loading products...</p>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                              />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium">No products found</h3>
                            <p className="mt-1">Try changing your search or filter criteria</p>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredProducts.map((product) => {
                                  const productImage =
                                    product.gallery && product.gallery.length > 0
                                      ? product.gallery[0].src
                                      : "/placeholder.png";

                                  return (
                                    <div
                                      key={product._id}
                                      className={`flex flex-col border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer ${
                                        selectedCategoryProducts.includes(product._id)
                                          ? "border-blue-400 bg-blue-50"
                                          : ""
                                      }`}
                                      onClick={() => handleToggleProductSelection(product._id)}
                                    >
                                      <div className="relative h-32 overflow-hidden bg-gray-100">
                                        <img
                                          src={productImage}
                                          alt={product.productName}
                                          className="h-full w-full object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "/placeholder.png";
                                          }}
                                        />
                                        {product.discountedPrice && (
                                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1">
                                            Already Discounted
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-2">
                                        <div className="text-xs font-medium truncate">
                                          {product.productName}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <div className="text-xs">
                                            <span className="font-bold">
                                              ${product.regularPrice?.toFixed(2)}
                                            </span>
                                            {product.discountedPrice && (
                                              <span className="text-red-500 line-through ml-1">
                                                ${product.discountedPrice?.toFixed(2)}
                                              </span>
                                            )}
                                          </div>
                                          <input
                                            type="checkbox"
                                            checked={selectedCategoryProducts.includes(product._id)}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleToggleProductSelection(product._id);
                                            }}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {product.category} / {product.subCategory}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between text-sm bg-gray-50 p-3 rounded-md">
                              <span>
                                <span className="font-medium">{selectedCategoryProducts.length}</span>{" "}
                                of {filteredProducts.length} products selected
                              </span>
                              {selectedCategoryProducts.length > 0 && formData.discountPercentage && (
                                <span className="text-blue-600">
                                  {formData.discountPercentage}% discount will be applied
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <label className="block text-sm mt-4 mb-1">Discount Percentage</label>
                  <input
                    type="number"
                    placeholder="Discount %"
                    className="w-full border p-2 rounded-xl"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercentage: e.target.value })
                    }
                    required
                  />

                  {formData.selectionMode === "single" && selectedProduct && priceInfo && (
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
                          <p className="font-medium text-red-600">
                            ${priceInfo.savedAmount} ({formData.discountPercentage}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="block text-sm mt-4 mb-1">Description (optional)</label>
                  <textarea
                    placeholder="Add description"
                    className="w-full border p-2 rounded-xl"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
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
                {loading ? "CREATING..." : "CREATE"}
              </button>
              <button
                type="button"
                className="bg-gray-200 px-8 py-2 rounded"
                onClick={() => router.push("/admin/discountlist")}
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

function getProductImage(product: Product): string {
  return product.gallery && product.gallery.length > 0
    ? product.gallery[0].src
    : "/placeholder.png";
}
