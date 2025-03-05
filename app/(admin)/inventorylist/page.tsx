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
  productId: string;
  productName: string;
  stock: number;
  status: string;
  image: string;
}

export default function InventoryListPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    outOfStock: 0,
    newlyAdded: 0
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        
        const data = await response.json();
        setInventory(data.inventory || []);
        
        // Calculate stats
        const inventoryItems = data.inventory || [];
        setStats({
          total: inventoryItems.length,
          inStock: inventoryItems.filter((item: InventoryItem) => item.status === 'In Stock').length,
          outOfStock: inventoryItems.filter((item: InventoryItem) => item.status === 'Out Of Stock').length,
          newlyAdded: inventoryItems.filter((item: InventoryItem) => item.status === 'Newly Added').length
        });
      } catch (err) {
        console.error("Error loading inventory:", err);
        setError("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory?search=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search inventory');
      }
      
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (err) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (id: string) => {
    router.push(`/inventorydetails?id=${id}`);
  };

  const handleEditItem = (id: string) => {
    router.push(`/inventoryedit?id=${id}`);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      // Implement delete functionality
      console.log("Delete item", id);
    }
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
        
        {/* Orders Summary Cards */}
        <div className="grid grid-cols-3 gap-10 mb-8 text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Total Product items</h2>
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
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Instock Products</h2>
              <p className="text-2xl font-bold inline">{stats.inStock}</p>
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
              <p className="text-2xl font-bold inline">{stats.outOfStock}</p>
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
        
        {/* Products Summary Cards */}
        <div className="grid grid-cols-3 gap-10 mb-8 text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">Newly added products</h2>
              <p className="text-2xl font-bold inline">{stats.newlyAdded}</p>
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
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6 ">
          <div className="flex justify-between items-center mb-4 ">
            <h2 className="text-lg font-semibold text-grey-600">
              All Inventory List
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="🔍 Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button 
                  onClick={handleSearch}
                  className="ml-2 px-4 py-2 bg-orange-500 text-white rounded-md"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-10">
              <p>Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-grey-600">
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
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded"></div>
                        )}
                        {item.productName}
                      </td>
                      <td className="p-3">{item.stock}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center ${
                            item.status === "In Stock"
                              ? "bg-green-300 text-green-800"
                              : item.status === "Out Of Stock"
                              ? "bg-orange-300 text-orange-800"
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
                    <td colSpan={4} className="p-6 text-center">
                      No inventory items found.
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
