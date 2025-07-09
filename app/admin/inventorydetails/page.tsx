"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, Suspense } from 'react';
import Image from "next/image";
import SuspenseWrapper from "../../components/SuspenseWrapper";

interface Color {
  name: string;
  src: string;
}

interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  stock: number;
  stockLimit?: number;
  status: string;
  image: string;
  sizeStock?: { [key: string]: number };
  colorStock?: { [key: string]: number };
  colorSizeStock?: { [color: string]: { [size: string]: number } };
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
        <p className="mt-2">Loading inventory details...</p>
      </div>
    </div>
  );
}

// Component that safely uses useSearchParams with proper error handling
function InventoryDetailsContent() {
  const router = useRouter();
  // Safely handle searchParams - this pattern helps with Next.js 15 CSR bailout issues
  let inventoryId: string | null = null;
  try {
    const searchParams = useSearchParams();
    inventoryId = searchParams?.get("id");
  } catch (err) {
    console.error("Error accessing search params:", err);
    // Fall back to client-side URL parsing if needed
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      inventoryId = urlParams.get("id");
    }
  }

  // State for the inventory item
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for UI selections
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [productColors, setProductColors] = useState<Color[]>([]);

  // Fetch inventory data when component mounts
  useEffect(() => {
    if (!inventoryId) {
      setError("No inventory ID provided");
      setLoading(false);
      return;
    }

    const fetchInventoryItem = async () => {
      try {
        setLoading(true);
        
        // Fetch inventory data from API
        const response = await fetch(`/api/inventory/${inventoryId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        let inventoryData = data.item;
        
        console.log("Original inventory data:", inventoryData);
        
        // Fetch associated product to get color information
        if (inventoryData.productId) {
          const productResponse = await fetch(`/api/products/${inventoryData.productId}`);
          
          if (productResponse.ok) {
            const productData = await productResponse.json();
            
            // Extract colors from product gallery
            const colors = productData.product.gallery?.map((item: any) => ({
              name: item.color || 'Default',
              src: item.src
            })) || [];
            
            setProductColors(colors);
            
            // Initialize colorStock and colorSizeStock if they don't exist
            const colorStock = inventoryData.colorStock || {};
            const colorSizeStock = inventoryData.colorSizeStock || {};
            
            // Initialize stock data for each color if not present
            colors.forEach((color: Color) => {
              if (!colorStock[color.name]) {
                colorStock[color.name] = 0;
              }
              
              // Make sure colorSizeStock[color] exists
              if (!colorSizeStock[color.name]) {
                colorSizeStock[color.name] = {};
              }
              
              // Initialize size stock for this color
              if (inventoryData.sizeStock) {
                Object.keys(inventoryData.sizeStock).forEach(size => {
                  // Only initialize if undefined, preserve existing values
                  if (colorSizeStock[color.name][size] === undefined) {
                    colorSizeStock[color.name][size] = 0;
                  }
                });
              }
            });
            
            // Update inventory data with color info and initialized stock
            inventoryData = {
              ...inventoryData,
              colorStock: colorStock,
              colorSizeStock: colorSizeStock
            };
            
            console.log("Processed inventory data with colorSizeStock:", 
              JSON.stringify(inventoryData.colorSizeStock, null, 2));
            
            // Set default color and size if available
            if (colors.length > 0) {
              setSelectedColor(colors[0].name);
            }
            
            if (inventoryData.sizeStock && Object.keys(inventoryData.sizeStock).length > 0) {
              setSelectedSize(Object.keys(inventoryData.sizeStock)[0]);
            }
          }
        }
        
        setInventory(inventoryData);
        
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

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
  };

  const handleEditStock = () => {
    if (inventory) {
      router.push(`/admin/inventoryedit?id=${inventory._id}`);
    }
  };

  // Function to get stock based on selected size and color
  const getCurrentStock = () => {
    if (!inventory) return 0;
    
    if (selectedColor && selectedSize && 
        inventory.colorSizeStock && 
        inventory.colorSizeStock[selectedColor] && 
        inventory.colorSizeStock[selectedColor][selectedSize] !== undefined) {
      return inventory.colorSizeStock[selectedColor][selectedSize];
    } else if (selectedSize && inventory.sizeStock && inventory.sizeStock[selectedSize] !== undefined) {
      return inventory.sizeStock[selectedSize];
    } else if (selectedColor && inventory.colorStock && inventory.colorStock[selectedColor] !== undefined) {
      return inventory.colorStock[selectedColor];
    }
    
    return inventory.stock;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-2">Loading inventory details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !inventory) {
    return (
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error || "Inventory item not found"}</p>
            <button 
              onClick={() => router.push('/admin/inventorylist')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
            >
              Back to Inventory List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Return the original UI with all content
  return (
    <div className="flex-1">
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Inventory Details</h1>
          {/* ...existing code for right side icons... */}
        </div>

        {/* Top Images */}
        <div className="grid grid-cols-2 m-8">
          <div>
            <img 
              src={productColors.length > 0 ? productColors[0].src : inventory.image || "/placeholder.png"} 
              className="w-3/5 rounded-lg shadow-lg" 
              alt="Main Product" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {productColors.slice(0, 4).map((color, index) => (
              <img 
                key={index}
                src={color.src} 
                className="w-3/5 rounded-lg shadow-lg" 
                alt={`${color.name} variant`}
              />
            ))}
            {/* Add placeholders if we don't have 4 color images */}
            {[...Array(Math.max(0, 4 - productColors.length))].map((_, index) => (
              <div 
                key={`placeholder-${index}`}
                className="w-3/5 rounded-lg shadow-lg bg-gray-200"
              ></div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="w-3/5">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">{inventory.productName}</h2>
              <p className="text-gray-600">Product ID: {inventory.productId}</p>

              {/* Size Selection */}
              {inventory.sizeStock && Object.keys(inventory.sizeStock).length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold">Size {'>'} {selectedSize}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
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
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mt-4">
                <p className="font-semibold">Stock - {getCurrentStock()}</p>
                <p className={`
                  ${inventory.status === "In Stock" ? "text-green-500" : 
                    inventory.status === "Out Of Stock" ? "text-red-500" : 
                    "text-yellow-500"}
                `}>
                  {inventory.status}
                </p>
              </div>

              {/* Color Selection */}
              {productColors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold">Colors {'>'} {selectedColor}</p>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {productColors.map((color) => (
                      <div
                        key={color.name}
                        onClick={() => handleColorSelect(color.name)}
                        className={`p-2 border rounded-md text-center ${
                            color.name === selectedColor
                                ? "border-orange-500"
                                : "border-gray-200"
                        } cursor-pointer`}
                      >
                        <div className="aspect-square w-20 h-20 mx-auto relative rounded-lg overflow-hidden">
                          <Image
                            src={color.src}
                            alt={color.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="mt-1 text-sm">{color.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Limit */}
              <div className="mt-4">
                <p className="font-semibold">Stock Limit: {inventory.stockLimit || 100}</p>
              </div>

               {/* Add Color-Size Combination Stock Table */}
            {inventory.colorSizeStock && selectedColor && inventory.sizeStock && Object.keys(inventory.sizeStock).length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-lg mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedColor} by Size Combinations
                </h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 text-left">Size</th>
                      <th className="p-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(inventory.sizeStock).map((size) => {
                      // Get the quantity safely with defaults
                      const quantity = inventory.colorSizeStock?.[selectedColor]?.[size] || 0;
                      
                      return (
                        <tr key={size} className="border-t">
                          <td className="p-3 text-left" >{size}</td>
                          <td className="p-3 text-right">{quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}



              
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
                      <th className="p-3">Size</th>
                      <th className="p-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(inventory.sizeStock).map(([size, quantity]) => (
                      <tr key={size} className="border-t">
                        <td className="p-3 pi-8">{size}</td>
                        <td className="p-3 pl-12">{quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Color-wise Stock Table */}
            {inventory.colorStock && Object.keys(inventory.colorStock).length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Color-wise Stock</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 pr-16">Color</th>
                      <th className="py-2 pr-8">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(inventory.colorStock).map(([color, quantity]) => {
                      const colorData = productColors.find((c) => c.name === color);
                      return (
                        <tr key={color} className="border-t">
                          <td className="p-3 pl-8 flex items-center gap-2">
                            {colorData && (
                              <div className="w-8 h-8 relative rounded overflow-hidden">
                                <Image
                                  src={colorData.src || "/placeholder.png"}
                                  alt={color}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span>{color}</span>
                          </td>
                          <td className="p-3 pl-12">{quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

              </div>
            )}
            {/* Edit Buttons */}
            <div className="mt-10 flex justify-end gap-10">
              <button
              onClick={handleEditStock}
              className="px-10 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
              Edit Stock
              </button>
              <button
              onClick={() => router.push("/admin/inventorylist")}
              className="px-10 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
              >
              Back
              </button>
            </div>

          </div>
        </div>
    
      </div>
    </div>
  );
}

// Main wrapper component with Suspense boundary
export default function InventoryDetailsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <Suspense fallback={<LoadingFallback />}>
        <InventoryDetailsContent />
      </Suspense>
    </div>
  );
}