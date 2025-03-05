"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  stock: number;
  status: string;
  image: string;
  sizeStock?: { [key: string]: number };
  colorStock?: { [key: string]: number };
}

export default function InventoryEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams?.get("id");

  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [addStockQty, setAddStockQty] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch inventory data
  useEffect(() => {
    if (!inventoryId) {
      setError("No inventory ID provided");
      setLoading(false);
      return;
    }
    
    const fetchInventoryItem = async () => {
      try {
        const response = await fetch(`/api/inventory/${inventoryId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInventory(data.item);
        
        // Set default selected size if available
        if (data.item.sizeStock && Object.keys(data.item.sizeStock).length > 0) {
          setSelectedSize(Object.keys(data.item.sizeStock)[0]);
        }
        
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
        setError("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventoryItem();
  }, [inventoryId]);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleAddStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAddStockQty(value);
  };

  const handleSaveStock = async () => {
    if (!inventory || !addStockQty) return;
    
    try {
      setSubmitting(true);
      
      // Calculate the new total stock
      const newStock = inventory.stock + parseInt(addStockQty);
      
      // Update size stock if selected
      const updatedSizeStock = { ...(inventory.sizeStock || {}) };
      if (selectedSize) {
        const currentSizeStock = updatedSizeStock[selectedSize] || 0;
        updatedSizeStock[selectedSize] = currentSizeStock + parseInt(addStockQty);
      }
      
      // Prepare payload
      const updatePayload = {
        _id: inventory._id,
        stock: newStock,
        sizeStock: updatedSizeStock,
        // Status will be set to In Stock automatically in the API
      };
      
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }
      
      const result = await response.json();
      
      // Update the local state with the new data
      setInventory(result.inventory);
      setAddStockQty(''); // Clear input
      
      // Show success message
      alert("Stock updated successfully!");
      
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Failed to update stock. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-2">Loading inventory data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error || "Inventory not found"}</p>
            <button 
              onClick={() => router.push('/inventorylist')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Back to Inventory List
            </button>
          </div>
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
          <h1 className="text-2xl font-semibold">Inventory Edit</h1>
          {/* ...existing code for right side icons... */}
        </div>

        {/* Breadcrumb */}
        <div className="mb-4">
          <p className="text-gray-500">Home &gt; Inventory &gt; Edit Stock</p>
        </div>

        {/* Status Badge */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">Current Stock Status</p>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                inventory.status === "In Stock"
                  ? "bg-green-300 text-green-800"
                  : inventory.status === "Out Of Stock"
                  ? "bg-red-300 text-red-800"
                  : "bg-yellow-300 text-yellow-800"
              }`}
            >
              {inventory.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-3/5">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 relative mr-4">
                  <Image 
                    src={inventory.image || "/placeholder.png"} 
                    alt={inventory.productName}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{inventory.productName}</h2>
                  <p className="text-gray-600">Current Stock: {inventory.stock}</p>
                </div>
              </div>

              {/* Size Selection */}
              {inventory.sizeStock && Object.keys(inventory.sizeStock).length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Size</p>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Object.keys(inventory.sizeStock).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`p-2 border rounded-md text-center ${
                          size === selectedSize
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {size} ({inventory.sizeStock?.[size] || 0})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Stock Input */}
              <div className="mt-6">
                <p className="font-semibold mb-2">Add Stock{selectedSize ? ` for Size ${selectedSize}` : ''}</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    className="p-2 border rounded-md w-full"
                    placeholder="Enter quantity to add"
                    value={addStockQty}
                    onChange={handleAddStockChange}
                    min="1"
                  />
                  <button
                    onClick={handleSaveStock}
                    disabled={submitting || !addStockQty}
                    className={`px-4 py-2 rounded-md ${
                      submitting || !addStockQty 
                        ? "bg-gray-400 text-white cursor-not-allowed" 
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {submitting ? "SAVING..." : "SAVE"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Adding stock will change status to "In Stock" automatically
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-2/5">
            {/* Size-wise Stock Table */}
            {inventory.sizeStock && Object.keys(inventory.sizeStock).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Size-wise Stock</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">Size</th>
                      <th className="p-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(inventory.sizeStock).map(([size, quantity]) => (
                      <tr key={size} className="border-t">
                        <td className="p-3">{size}</td>
                        <td className="p-3 text-right">{quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Stock Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Stock Summary</h2>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-md">
                <span className="font-medium">Total Available Stock:</span>
                <span className="text-lg font-bold">{inventory.stock}</span>
              </div>
              
              {inventory.status === "Out Of Stock" && (
                <p className="mt-4 text-red-600">
                  ⚠️ This product is currently out of stock.
                </p>
              )}
              
              {inventory.status === "Newly Added" && (
                <p className="mt-4 text-yellow-600">
                  ⓘ This is a newly added product. Add stock to make it available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push("/inventorylist")}
            className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          >
            BACK TO LIST
          </button>
        </div>
      </div>
    </div>
  );
}