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
    gallery: Array<{
      src: string;
      name: string;
      color: string;
    }>;
    category: string;
    subCategory: string;
  };
  quantity: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function InventoryEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [isNewlyCreated, setIsNewlyCreated] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
        setQuantity(data.inventoryItem.quantity);
        setTags(data.inventoryItem.tags || []);
        setIsNewlyCreated(data.inventoryItem.tags?.includes('newly created') || false);
      } catch (err) {
        console.error("Error fetching inventory item:", err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItem();
  }, [id]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 0 || isNaN(value)) {
      setQuantity(isNaN(value) ? 0 : value);
    }
  };

  const handleNewlyCreatedTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsNewlyCreated(e.target.checked);
  };

  const handleSave = async () => {
    if (!inventoryItem) return;

    // Update tags based on checkbox
    const updatedTags = [...tags.filter(tag => tag !== 'newly created')];
    if (isNewlyCreated) {
      updatedTags.push('newly created');
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/inventory/${inventoryItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          tags: updatedTags
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update inventory');
      }

      // Navigate back to inventory list
      router.push('/inventorylist');
    } catch (err) {
      console.error("Error updating inventory:", err);
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <TopBar title="Edit Inventory" />
        
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold text-gray-800">Edit Inventory</h2>
                <p className="text-gray-500">Update inventory details for this product</p>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                    {inventoryItem.productId.gallery && inventoryItem.productId.gallery.length > 0 ? (
                      <img 
                        src={inventoryItem.productId.gallery[0].src} 
                        alt={inventoryItem.productId.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{inventoryItem.productId.productName}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-medium">{inventoryItem.productId.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Subcategory</p>
                        <p className="font-medium">{inventoryItem.productId.subCategory}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product ID</p>
                        <p className="font-medium text-xs">{inventoryItem.productId._id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Inventory ID</p>
                        <p className="font-medium text-xs">{inventoryItem._id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="0"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-8">
                        <span className="text-gray-500">items</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isNewlyCreated}
                        onChange={handleNewlyCreatedTagChange}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Mark as "Newly Created"</span>
                    </label>
                    <p className="text-gray-500 text-sm mt-1 ml-6">
                      This will display a "Newly Added" badge in the inventory list.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white 
                    ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'}`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
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