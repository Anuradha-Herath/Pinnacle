"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { BellIcon, Cog6ToothIcon, ClockIcon } from "@heroicons/react/24/solid";
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';

interface ColorItem {
  name: string;
  src: string;
}

interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  stock: number;
  status: string;
  image: string;
  sizeStock?: { [key: string]: number };
  colorStock?: { [key: string]: number };
  colorSizeStock?: { [color: string]: { [size: string]: number } };
  colors?: ColorItem[];
}

// Create a separate component that uses useSearchParams
function InventoryEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams?.get("id");

  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productData, setProductData] = useState<any>(null);
  const [productColors, setProductColors] = useState<ColorItem[]>([]);

  // Form states
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [stockChangeQty, setStockChangeQty] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(true);
  
  // Fetch inventory data
  useEffect(() => {
    if (!inventoryId) {
      setError("No inventory ID provided");
      setLoading(false);
      return;
    }
    
    const fetchInventoryItem = async () => {
      try {
        // Fetch inventory data
        const response = await fetch(`/api/inventory/${inventoryId}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        let inventoryData = data.item;
        
        console.log("Original inventory data from API:", inventoryData);
        console.log("ColorSizeStock in data:", JSON.stringify(inventoryData.colorSizeStock || {}, null, 2));
        
        // Now fetch the product data to get color information
        if (inventoryData.productId) {
          const productResponse = await fetch(`/api/products/${inventoryData.productId}`);
          
          if (productResponse.ok) {
            const productData = await productResponse.json();
            setProductData(productData.product);
            
            // Extract colors from product gallery
            const colors = productData.product.gallery?.map((item: any) => ({
              name: item.color || 'Default',
              src: item.src
            })) || [];
            
            setProductColors(colors);
            
            // Initialize with defaults and copy existing values
            const colorStock = inventoryData.colorStock ? { ...inventoryData.colorStock } : {};
            const colorSizeStock = { ...inventoryData.colorSizeStock };
            
            // Initialize stock data for each color if not present
            colors.forEach((color: ColorItem) => {
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
            
            console.log("Initialized colorSizeStock:", JSON.stringify(colorSizeStock, null, 2));
            
            // Update inventory data with color information and initialized stock
            inventoryData = {
              ...inventoryData,
              colors: colors,
              colorStock: colorStock,
              colorSizeStock: colorSizeStock
            };
          }
        }
        
        // Always log the final processed inventory data
        console.log("Final processed inventory data:", inventoryData);
        
        setInventory(inventoryData);
        
        // Set default selected size if available
        if (inventoryData.sizeStock && Object.keys(inventoryData.sizeStock).length > 0) {
          setSelectedSize(Object.keys(inventoryData.sizeStock)[0]);
        }
        
        // Set default selected color if available
        if (inventoryData.colors && inventoryData.colors.length > 0) {
          setSelectedColor(inventoryData.colors[0].name);
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
  
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleStockChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setStockChangeQty(value);
  };
  
  const toggleMode = () => {
    setIsAddingStock(!isAddingStock);
  };

  const handleSaveStock = async () => {
    if (!inventory || !stockChangeQty) return;
    
    try {
      setSubmitting(true);
      
      // Convert input to number and apply sign based on mode
      const quantityChange = parseInt(stockChangeQty) * (isAddingStock ? 1 : -1);
      
      // Calculate the new total stock
      const newStock = inventory.stock + quantityChange;
      
      // Validate that stock won't go negative
      if (newStock < 0) {
        alert("Stock cannot be reduced below zero!");
        setSubmitting(false);
        return;
      }
      
      // Create copies of the stock objects for updating
      const updatedSizeStock = { ...(inventory.sizeStock || {}) };
      const updatedColorStock = { ...(inventory.colorStock || {}) };
      const updatedColorSizeStock = JSON.parse(JSON.stringify(inventory.colorSizeStock || {}));
      
      // Make sure the color exists in colorSizeStock
      if (selectedColor && !updatedColorSizeStock[selectedColor]) {
        updatedColorSizeStock[selectedColor] = {};
        
        // Initialize with zeros for all sizes
        if (inventory.sizeStock) {
          Object.keys(inventory.sizeStock || {}).forEach(size => {
            updatedColorSizeStock[selectedColor][size] = 0;
          });
        }
      }
      
      // Update size stock if selected
      if (selectedSize) {
        const currentSizeStock = updatedSizeStock[selectedSize] || 0;
        const newSizeStock = currentSizeStock + quantityChange;
        
        // Validate that size stock won't go negative
        if (newSizeStock < 0) {
          alert(`Size ${selectedSize} stock cannot be reduced below zero!`);
          setSubmitting(false);
          return;
        }
        
        updatedSizeStock[selectedSize] = newSizeStock;
      }
      
      // Update color stock if selected
      if (selectedColor) {
        const currentColorStock = updatedColorStock[selectedColor] || 0;
        const newColorStock = currentColorStock + quantityChange;
        
        // Validate that color stock won't go negative
        if (newColorStock < 0) {
          alert(`Color ${selectedColor} stock cannot be reduced below zero!`);
          setSubmitting(false);
          return;
        }
        
        updatedColorStock[selectedColor] = newColorStock;
        
        // Update color-size combination stock if both color and size are selected
        if (selectedSize) {
          // Ensure nested structure exists
          if (!updatedColorSizeStock[selectedColor]) {
            updatedColorSizeStock[selectedColor] = {};
          }
          
          const currentColorSizeStock = updatedColorSizeStock[selectedColor][selectedSize] || 0;
          const newColorSizeStock = currentColorSizeStock + quantityChange;
          
          // Validate that color-size stock won't go negative
          if (newColorSizeStock < 0) {
            alert(`${selectedColor} in size ${selectedSize} stock cannot be reduced below zero!`);
            setSubmitting(false);
            return;
          }
          
          updatedColorSizeStock[selectedColor][selectedSize] = newColorSizeStock;
          
          console.log(`Updated ${selectedColor}/${selectedSize} stock to:`, newColorSizeStock);
        }
      }
      
      // Before sending the API request, make sure colorSizeStock exists for all colors and sizes
      Object.keys(updatedColorStock).forEach(color => {
        if (!updatedColorSizeStock[color]) {
          updatedColorSizeStock[color] = {};
        }
        
        if (inventory.sizeStock) {
          Object.keys(inventory.sizeStock ?? {}).forEach(size => {
            if (updatedColorSizeStock[color][size] === undefined) {
              updatedColorSizeStock[color][size] = 0;
            }
          });
        }
      });

      // Prepare payload
      const updatePayload = {
        _id: inventory._id,
        stock: newStock,
        sizeStock: updatedSizeStock,
        colorStock: updatedColorStock,
        colorSizeStock: updatedColorSizeStock
      };
      
      console.log("Sending complete payload to API:", 
        JSON.stringify(updatePayload.colorSizeStock, null, 2));
        
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
      console.log("Received API response:", result);
      
      // Create a merged state to ensure all data is preserved
      const updatedInventory = {
        ...inventory,                       // Start with all existing inventory data
        stock: newStock,                    // Use our calculated values to ensure UI consistency
        sizeStock: updatedSizeStock,
        colorStock: updatedColorStock,
        colorSizeStock: updatedColorSizeStock,
        status: result.inventory.status,    // Take status from API response
        colors: productColors               // Ensure colors array is preserved
      };
      
      // Log to verify the structure
      console.log("Updated inventory state:", JSON.stringify(updatedInventory.colorSizeStock, null, 2));
      
      // Update the local state with the merged data
      setInventory(updatedInventory);
      
      setStockChangeQty(''); // Clear input
      
      // Show success message
      alert(`Stock ${isAddingStock ? 'increased' : 'decreased'} successfully!`);
      
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("Failed to update stock. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Add this new function to handle saving all changes
  const handleSaveAllChanges = async () => {
    if (!inventory) return;
    
    try {
      setSubmitting(true);
      
      // Create a complete colorSizeStock structure with all combinations
      const completeColorSizeStock: { [color: string]: { [size: string]: number } } = {};
      
      // Make sure every color has every size properly initialized
      if (productColors && inventory.sizeStock) {
        productColors.forEach(color => {
          completeColorSizeStock[color.name] = {};
          
          Object.keys(inventory.sizeStock ?? {}).forEach(size => {
            // Get existing stock or default to 0
            const existingStock = 
              inventory.colorSizeStock?.[color.name]?.[size] !== undefined
                ? inventory.colorSizeStock[color.name][size]
                : 0;
                
            completeColorSizeStock[color.name][size] = existingStock;
          });
        });
      }
      
      // Prepare the complete payload
      const updatePayload = {
        _id: inventory._id,
        productId: inventory.productId,
        stock: inventory.stock,
        status: inventory.status,
        sizeStock: inventory.sizeStock || {},
        colorStock: inventory.colorStock || {},
        colorSizeStock: completeColorSizeStock  // Use our complete structure
      };
      
      console.log("Saving all inventory data with complete colorSizeStock:", 
        JSON.stringify(updatePayload.colorSizeStock, null, 2));
      
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save inventory data');
      }
      
      const result = await response.json();
      console.log("Successfully saved inventory data:", result);
      
      // Show success message
      alert("All inventory changes saved successfully!");
      
    } catch (err) {
      console.error("Error saving inventory data:", err);
      alert("Failed to save inventory data. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get current stock level based on selected size and color
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

  // Return the same UI components
  if (loading) {
    return (
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
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
      <div className="flex-1">
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{error || "Inventory not found"}</p>
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

  // Return the main content
  return (
    <div className="flex-1">
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Inventory Edit</h1>
          {/* Right side icons */}
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
                    src={selectedColor && productColors && productColors.length > 0 
                      ? (productColors.find(c => c.name === selectedColor)?.src || inventory.image) 
                      : inventory.image || "/placeholder.png"} 
                    alt={inventory.productName}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{inventory.productName}</h2>
                  <p className="text-gray-600">Current Total Stock: {inventory.stock}</p>
                </div>
              </div>

              {/* Color Selection */}
              {productColors && productColors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Color</p>
                  <div className="grid grid-cols-4 gap-4 mt-2">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorSelect(color.name)}
                        className={`border p-1 rounded-md ${
                          color.name === selectedColor ? "border-2 border-orange-500" : ""
                        }`}
                      >
                        <div className="aspect-square w-full h-16 relative rounded mb-1">
                          <Image 
                            src={color.src || "/placeholder.png"}
                            alt={color.name}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                        <p className="text-xs text-center truncate">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        {size} {
                          selectedColor && inventory.colorSizeStock && 
                          inventory.colorSizeStock[selectedColor] && 
                          inventory.colorSizeStock[selectedColor][size] !== undefined 
                            ? `(${inventory.colorSizeStock[selectedColor][size]})`
                            : `(${inventory.sizeStock?.[size] ?? 0})`
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Selected Combination Stock */}
              {(selectedColor || selectedSize) && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <p className="font-medium">
                    {selectedColor && selectedSize 
                      ? `Current stock for ${selectedColor} in size ${selectedSize}: ${getCurrentStock()}`
                      : selectedColor 
                      ? `Current stock for ${selectedColor}: ${getCurrentStock()}`
                      : selectedSize 
                      ? `Current stock for size ${selectedSize}: ${getCurrentStock()}`
                      : ''}
                  </p>
                </div>
              )}

              {/* Add/Reduce Stock Toggle and Input */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">
                    {isAddingStock ? 'Add Stock' : 'Reduce Stock'}
                    {selectedColor && selectedSize 
                      ? ` for ${selectedColor} in size ${selectedSize}` 
                      : selectedColor 
                      ? ` for ${selectedColor}` 
                      : selectedSize 
                      ? ` for Size ${selectedSize}` 
                      : ''}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Reduce</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isAddingStock}
                        onChange={toggleMode}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                    <span className="text-sm text-gray-600">Add</span>
                  </div>
                </div>
                
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    className="p-2 border rounded-md w-full"
                    placeholder={`Enter quantity to ${isAddingStock ? 'add' : 'reduce'}`}
                    value={stockChangeQty}
                    onChange={handleStockChangeInput}
                    min="1"
                  />
                  <button
                    onClick={handleSaveStock}
                    disabled={submitting || !stockChangeQty}
                    className={`px-4 py-2 rounded-md ${
                      submitting || !stockChangeQty 
                        ? "bg-gray-400 text-white cursor-not-allowed" 
                        : isAddingStock
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {submitting ? "SAVING..." : isAddingStock ? "ADD" : "REDUCE"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {isAddingStock 
                    ? "Adding stock will change status to \"In Stock\" automatically"
                    : "Reducing stock to zero will change status to \"Out Of Stock\" automatically"}
                </p>
              </div>
                    {/* Color-Size Combination Table (show if selected color) */}
            {selectedColor && productColors && productColors.length > 0 && inventory.sizeStock && (
              <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedColor} by Size
                </h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-16 py-3 text-center">Size</th>
                      <th className="px-16 py-3 text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(inventory.sizeStock).map((size) => {
                      // Safely access the value with fallback to 0
                      let sizeQuantity = 0;
                      
                      try {
                        if (inventory.colorSizeStock && 
                            inventory.colorSizeStock[selectedColor]) {
                          sizeQuantity = inventory.colorSizeStock[selectedColor][size] || 0;
                        }
                      } catch (e) {
                        console.error(`Error retrieving ${selectedColor}/${size} stock:`, e);
                      }
                      
                      return (
                        <tr key={size} className="border-t">
                          <td className="px-100 py-3 text-center">{size}</td>
                          <td className="px-100 py-3 text-center">{sizeQuantity}</td>
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
            {/* Color-wise Stock Table */}
            {productColors && productColors.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Color-wise Stock</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th  className="px-16 py-3 text-center">Color</th>
                      <th  className="px-16 py-3 text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productColors.map((colorItem) => {
                      const colorName = colorItem.name;
                      // Make sure we're checking inventory.colorStock exists before accessing
                      const quantity = inventory?.colorStock && colorName in inventory.colorStock 
                        ? inventory.colorStock[colorName] 
                        : 0;
                      
                      return (
                        <tr key={colorName} className="border-t">
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-8 h-8 relative rounded overflow-hidden">
                              <Image
                                src={colorItem.src || "/placeholder.png"}
                                alt={colorName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {colorName}
                          </td>
                          <td className="px-25 py-3 text-center">{quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Size-wise Stock Table */}
            {inventory.sizeStock && Object.keys(inventory.sizeStock).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-lg font-semibold mb-4 text-center">Size-wise Stock</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-16 py-3 text-center">Size</th>
                      <th className="px-16 py-3 text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(inventory.sizeStock).map(([size, quantity]) => (
                      <tr key={size} className="border-t">
                        <td className="px-25 py-3 text-center font-medium">{size}</td>
                        <td className="px-25 py-3 text-center">{quantity}</td>
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

        {/* Combined Back and Save Button Row */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleSaveAllChanges}
            disabled={submitting}
            className={`px-6 py-2 rounded-md font-semibold ${
              submitting 
                ? "bg-gray-400 text-white cursor-not-allowed" 
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {submitting ? "SAVING..." : "SAVE ALL INVENTORY DATA"}
          </button>
          <button
            onClick={() => router.push("/admin/inventorylist")}
            className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          >
            BACK TO LIST
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
        <p className="mt-2">Loading...</p>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500">Something went wrong loading this page</p>
        <a href="/admin/inventorylist" className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md inline-block">
          Back to Inventory List
        </a>
      </div>
    </div>
  );
}

// Main page component that wraps the form in Suspense
export default function InventoryEditPage() {
  return (
    <div className="flex">
      <Sidebar />
      <Suspense fallback={<LoadingFallback />}>
        <InventoryEditForm />
      </Suspense>
    </div>
  );
}