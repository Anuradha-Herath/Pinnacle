"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  BellIcon,
  Cog6ToothIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import Image from "next/image";

interface InventoryItem {
  _id: string;
  productId: {
    _id: string;
    productName: string;
    gallery: Array<{
      src: string;
      name: string;
      color: string;
    }>;
  };
  quantity: number;
  tags: string[];
}

export default function InventoryListPage() {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [inStockItems, setInStockItems] = useState<number>(0);
  const [outOfStockItems, setOutOfStockItems] = useState<number>(0);
  const [newlyCreatedItems, setNewlyCreatedItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/inventory?page=${currentPage}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory data');
        }
        
        const data = await response.json();
        setInventoryItems(data.inventoryItems);
        
        // Set pagination info
        setTotalPages(data.pagination?.pages || 1);
        
        // Calculate statistics
        setTotalItems(data.pagination?.total || data.inventoryItems.length);
        setInStockItems(data.inventoryItems.filter((item: InventoryItem) => item.quantity > 0).length);
        setOutOfStockItems(data.inventoryItems.filter((item: InventoryItem) => item.quantity === 0 && !item.tags.includes('newly created')).length);
        setNewlyCreatedItems(data.inventoryItems.filter((item: InventoryItem) => item.tags.includes('newly created')).length);
        
      } catch (err) {
        console.error("Error fetching inventory data:", err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [currentPage]);

  const getItemStatus = (item: InventoryItem): string => {
    if (item.tags.includes('newly created')) {
      return 'Newly Added';
    } else if (item.quantity > 0) {
      return 'In Stock';
    } else {
      return 'Out Of Stock';
    }
  };

  const filteredInventory = inventoryItems.filter(item => 
    item.productId.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle page navigation
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

  const handleViewItem = (id: string) => {
    router.push(`/inventorydetail/${id}`);
  };

  const handleEditItem = (id: string) => {
    router.push(`/inventoryedit/${id}`);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 p-6 flex-1">
        {/* Top Bar with Icons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-600">
            Inventory List
          </h1>

          {/* Top-Right Icons */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={() => router.push("/notifications")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Clock Icon (e.g., Order History, Activity Log, etc.) */}
            <button
              onClick={() => router.push("/history")}
              className="p-2 hover:bg-gray-200 rounded-lg"
            >
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push("../../profilepage")}
              className="p-1 rounded-full border-2 border-gray-300"
            >
              <img
                src="/p9.webp"
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            </button>
          </div>
        </div>
        
        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-3 gap-10 mb-8 text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Total Product items</h2>
              <p className="text-2xl font-bold inline">{totalItems}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-orange-500"
              >
                <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                <path
                  fillRule="evenodd"
                  d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.163 3.75A.75.75 0 0 1 10 12h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Instock Products</h2>
              <p className="text-2xl font-bold inline">{inStockItems}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-orange-500"
              >
                <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
                <path
                  fillRule="evenodd"
                  d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3Zm3-6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-3Zm8.25-.75a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-5.25a.75.75 0 0 0-.75-.75h-3Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Out Of Stock Products</h2>
              <p className="text-2xl font-bold inline">{outOfStockItems}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-orange-500"
              >
                <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                <path
                  fillRule="evenodd"
                  d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.133 2.845a.75.75 0 0 1 1.06 0l1.72 1.72 1.72-1.72a.75.75 0 1 1 1.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 1 1-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 1 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Newly Added Products Summary Card */}
        <div className="grid grid-cols-3 gap-10 mb-8 text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Newly added products</h2>
              <p className="text-2xl font-bold inline">{newlyCreatedItems}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg pl-30 ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-orange-500"
              >
                <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                <path
                  fillRule="evenodd"
                  d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087ZM12 10.5a.75.75 0 0 1 .75.75v4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72v-4.94a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Inventory List Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-grey-600">
              All Inventory List
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="🔍 Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button className="px-4 py-2 border rounded-lg text-gray-600">
                This Month ▼
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p>Loading inventory data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-grey-600">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">All Products</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="p-3 flex items-center gap-3">
                        {item.productId.gallery && item.productId.gallery.length > 0 ? (
                          <img 
                            src={item.productId.gallery[0].src} 
                            alt={item.productId.productName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs">No img</span>
                          </div>
                        )}
                        {item.productId.productName}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center ${
                            getItemStatus(item) === "In Stock"
                              ? "bg-green-300 text-green-800"
                              : getItemStatus(item) === "Out Of Stock"
                              ? "bg-orange-300 text-orange-800"
                              : getItemStatus(item) === "Newly Added"
                              ? "bg-yellow-300 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {getItemStatus(item)}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 justify-end">
                        <button 
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                          onClick={() => handleViewItem(item._id)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                          onClick={() => handleEditItem(item._id)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this inventory item?')) {
                              // Delete functionality will be added here
                            }
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6">
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div>
          <div className="flex justify-end mt-6 pr-4">
            <div className="flex items-center space-x-0">
              <button 
                className={`px-4 py-2 border-r bg-white ${currentPage > 1 ? 'hover:bg-gray-200' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              
              {/* Generate page buttons */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = currentPage > 2 && totalPages > 3 
                  ? currentPage - 1 + i 
                  : i + 1;
                  
                if (pageNum <= totalPages) {
                  return (
                    <button 
                      key={pageNum}
                      className={`px-4 py-2 ${pageNum === currentPage 
                        ? 'bg-orange-500 text-white font-semibold' 
                        : 'bg-white hover:bg-gray-200 border-l'}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {totalPages > 3 && currentPage < totalPages - 1 && (
                <>
                  <span className="px-4 py-2 bg-white">...</span>
                  <button 
                    className="px-4 py-2 bg-white hover:bg-gray-200 border-l"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button 
                className={`px-4 py-2 border-l bg-white ${currentPage < totalPages ? 'hover:bg-gray-200' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
