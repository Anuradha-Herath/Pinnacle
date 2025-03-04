"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";

interface InventoryItem {
  _id: string;
  productId: {
    _id: string;
    productName: string;
    description: string;
    category: string;
    subCategory: string;
    regularPrice: number;
    sizes: string[];
    gallery: Array<{
      src: string;
      name: string;
      color: string;
    }>;
  };
  quantity: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function InventoryDetailPage() {
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract ID from URL
  const id = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (!id) {
      setError('Invalid inventory ID');
      setLoading(false);
      return;
    }

    const fetchInventoryItem = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/inventory/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch inventory item');
        }
        
        const data = await response.json();
        setInventoryItem(data.inventoryItem);
      } catch (err) {
        console.error("Error fetching inventory item:", err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItem();
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <TopBar title="Inventory Details" />
        
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Inventory List
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-orange-500 mb-4"></div>
              <p>Loading inventory data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>Error: {error}</p>
            </div>
          ) : inventoryItem ? (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{inventoryItem.productId.productName}</h1>
                    <p className="text-gray-500 mt-1">Inventory Details</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => router.push(`/inventoryedit/${inventoryItem._id}`)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                      Edit Inventory
                    </button>
                    <button 
                      onClick={() => router.push(`/products/${inventoryItem.productId._id}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image Gallery */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Product Images</h2>
                  {inventoryItem.productId.gallery && inventoryItem.productId.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {inventoryItem.productId.gallery.map((image, index) => (
                        <div key={index} className="border rounded-md overflow-hidden h-40">
                          <img 
                            src={image.src} 
                            alt={`${inventoryItem.productId.productName} - ${image.color}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-md p-12 text-center text-gray-500">
                      No images available
                    </div>
                  )}
                </div>
                
                {/* Inventory & Product Details */}
                <div className="space-y-6">
                  {/* Inventory Details */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Inventory Information</h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold">{inventoryItem.quantity} items</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-semibold ${
                          inventoryItem.tags?.includes('newly created') 
                            ? 'text-yellow-600'
                            : inventoryItem.quantity > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {inventoryItem.tags?.includes('newly created') 
                            ? 'Newly Added' 
                            : inventoryItem.quantity > 0 
                            ? 'In Stock' 
                            : 'Out of Stock'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDate(inventoryItem.createdAt)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span>{formatDate(inventoryItem.updatedAt)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {inventoryItem.tags?.map((tag, index) => (
                          <span key={index} className="inline-block px-3 py-1 bg-gray-200 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Details */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Product Details</h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-semibold">${inventoryItem.productId.regularPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span>{inventoryItem.productId.category} / {inventoryItem.productId.subCategory}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Available Sizes:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {inventoryItem.productId.sizes.map((size, index) => (
                            <span key={index} className="inline-block px-3 py-1 bg-gray-200 rounded-full text-sm">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Description */}
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Description</h2>
                    <p className="text-gray-700">
                      {inventoryItem.productId.description || "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              <p>Inventory item not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
