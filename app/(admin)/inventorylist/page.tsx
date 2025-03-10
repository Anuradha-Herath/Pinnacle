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
  PlusCircleIcon, // Add this import for the plus icon
} from "@heroicons/react/24/solid";
import Sidebar from "../../components/Sidebar";
import Image from "next/image";

// Define interface for inventory item
interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  stock: number;
  status: string;
  image: string;
}

export default function InventoryList() {
  const router = useRouter();
  
  // States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Stats for inventory counts
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    outOfStock: 0,
    newlyAdded: 0
  });

  // Fetch inventory data
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (status: string | null = null) => {
    try {
      setLoading(true);
      setError("");
      
      // Build URL with optional status filter
      let url = '/api/inventory';
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }
      
      console.log("Fetching inventory from:", url);
      
      const response = await fetch(url);
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(`Failed to fetch inventory: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Received inventory data:", data);
      
      setInventory(data.inventory || []);
      
      // Update stats from API response
      if (data.counts) {
        setStats(data.counts);
      }
      
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError(`Failed to load inventory data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      fetchInventory(activeFilter || null);
      return;
    }
    
    // Filter locally for simplicity
    // In a real app, you might want to send the search query to the API
    const filtered = inventory.filter(item => 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setInventory(filtered);
  };

  // Handle filter by status
  const handleFilterByStatus = (status: string | null) => {
    // Toggle filter if clicking the same status again
    if (status === activeFilter) {
      setActiveFilter(null);
      fetchInventory();
    } else {
      setActiveFilter(status);
      fetchInventory(status);
    }
  };

  // Handle view item
  const handleViewItem = (id: string) => {
    router.push(`/inventorydetails?id=${id}`);
  };

  // Handle edit item
  const handleEditItem = (id: string) => {
    router.push(`/inventoryedit?id=${id}`);
  };

  // Handle delete item
  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Refresh inventory after delete
          fetchInventory(activeFilter || null);
        } else {
          alert('Failed to delete inventory item');
        }
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        alert('An error occurred while deleting');
      }
    }
  };

  // Handle add stock (redirects to inventory edit page)
  const handleAddStock = (id: string) => {
    router.push(`/inventoryedit?id=${id}`);
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

            {/* Clock Icon */}
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

        {/* First row - Three cards: Total, In Stock, Out of Stock */}
        <div className="grid grid-cols-3 gap-6 mb-6 text-gray-600">
          <div 
            onClick={() => handleFilterByStatus(null)}
            className={`bg-white p-4 rounded-lg shadow-md flex items-center gap-4 cursor-pointer ${activeFilter === null ? 'ring-2 ring-orange-500' : ''}`}
          >
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Total Products</h2>
              <p className="text-2xl font-bold inline">{stats.total}</p>
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
          
          <div 
            onClick={() => handleFilterByStatus('In Stock')}
            className={`bg-white p-4 rounded-lg shadow-md flex items-center gap-4 cursor-pointer ${activeFilter === 'In Stock' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div>
              <h2 className="text-lg font-semibold">Instock Products</h2>
              <p className="text-2xl font-bold inline">{stats.inStock}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-green-500"
              >
                <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
                <path
                  fillRule="evenodd"
                  d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          
          <div 
            onClick={() => handleFilterByStatus('Out Of Stock')}
            className={`bg-white p-4 rounded-lg shadow-md flex items-center gap-4 cursor-pointer ${activeFilter === 'Out Of Stock' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div>
              <h2 className="text-lg font-semibold">Out Of Stock Products</h2>
              <p className="text-2xl font-bold inline">{stats.outOfStock}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-red-500"
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
        
        {/* Second row - Just the Newly Added card */}
        <div className="grid grid-cols-3 gap-6 mb-6 text-gray-600">
          <div 
            onClick={() => handleFilterByStatus('Newly Added')}
            className={`bg-white p-4 rounded-lg shadow-md flex items-center gap-4 cursor-pointer ${activeFilter === 'Newly Added' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Newly Added Products</h2>
              <p className="text-2xl font-bold inline">{stats.newlyAdded}</p>
              <span className="mx-2"></span>
              <p className="inline">(items)</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-yellow-500"
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
          {/* Empty placeholder divs to maintain grid alignment */}
          <div className="invisible"></div>
          <div className="invisible"></div>
        </div>

        {/* Inventory List Table */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-600">
                All Inventory List
              </h2>
              {activeFilter && (
                <span className="ml-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Showing: {activeFilter}
                  <button 
                    className="ml-2 text-blue-600 hover:text-blue-800" 
                    onClick={() => handleFilterByStatus(null)}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                <input
                  type="text"
                  placeholder="🔍 Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border px-3 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button 
                  className="bg-orange-500 text-white px-4 py-2 rounded-r-md"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
              <p className="mt-2">Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : (
            <table className="w-full border-collapse text-gray-600">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">All Products</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3 text-right pr-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length > 0 ? (
                  inventory.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                          <Image
                            src={item.image || "/placeholder.png"}
                            alt={item.productName}
                            fill
                            className="rounded-md object-cover"
                            sizes="40px"
                          />
                        </div>
                        {item.productName}
                      </td>
                      <td className="p-3">{item.stock}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center ${
                            item.status === "In Stock"
                              ? "bg-green-300 text-green-800"
                              : item.status === "Out Of Stock"
                              ? "bg-red-300 text-red-800"
                              : item.status === "Newly Added"
                              ? "bg-yellow-300 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 justify-end">
                        <button 
                          onClick={() => handleAddStock(item._id)}
                          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                          title="Add Stock"
                        >
                          <PlusCircleIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewItem(item._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditItem(item._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 bg-orange-400 text-white rounded-md hover:bg-orange-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      {activeFilter 
                        ? `No ${activeFilter.toLowerCase()} inventory items found.` 
                        : "No inventory items found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {inventory.length > 0 && (
            <div className="flex justify-end mt-6 pr-4">
              <div className="flex items-center border rounded-md overflow-hidden shadow-md">
                <button className="px-4 py-2 border-r bg-white hover:bg-gray-200">Previous</button>
                <button className="px-4 py-2 bg-orange-500 text-white font-semibold">1</button>
                <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">2</button>
                <button className="px-4 py-2 border-l bg-white hover:bg-gray-200">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
