"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import { XIcon } from "lucide-react";

interface ProductData {
  _id: string;
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: number;
  tag: string;
  sizes: string[];
  gallery: { src: string; color: string; name: string; additionalImages?: any[] }[];
  occasions?: string[];
  style?: string[];
  season?: string[];
  fitType?: string;
  sizingTrend?: number;
  sizingNotes?: string;
  colors?: { name: string; quantity: number }[];
  inventory?: Record<string, number>;
}

interface InventoryData {
  _id: string;
  productId: string;
  productName: string;
  stock: number;
  status: string;
  stockLimit?: number;
  sizeStock?: { [key: string]: number };
  colorStock?: { [key: string]: number };
  colorSizeStock?: { [color: string]: { [size: string]: number } };
  image: string;
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewingAdditionalImage, setViewingAdditionalImage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch product data
        const productResponse = await fetch(`/api/products/${id}`);
        if (!productResponse.ok) {
          throw new Error("Failed to fetch product");
        }
        const productData = await productResponse.json();

        setProduct(productData.product);

        // Fetch inventory data using product ID
        const inventoryResponse = await fetch(`/api/inventory/product/${productData.product._id}`);
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setInventory(inventoryData.inventory);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const tags = product?.tag ? product.tag.split(",").map((tag) => tag.trim()) : [];

  const getSizingTrendText = (trend?: number) => {
    if (trend === -1) return "Runs Small";
    if (trend === 1) return "Runs Large";
    return "True to Size";
  };

  // Image modal functions
  const openImageModal = (src: string) => {
    setSelectedImage(src);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setViewingAdditionalImage(false);
  };

  const viewMainImage = () => {
    if (product?.gallery[activeImageIndex]?.src) {
      openImageModal(product.gallery[activeImageIndex].src);
      setViewingAdditionalImage(false);
    }
  };

  const viewAdditionalImage = (src: string) => {
    openImageModal(src);
    setViewingAdditionalImage(true);
  };

  // Helper function to get color inventory from actual data
  const getColorInventory = () => {
    if (!product || !inventory?.colorStock) return [];
    
    return product.gallery.map(item => ({
      name: item.color,
      quantity: inventory.colorStock?.[item.color] || 0
    }));
  };

  // Helper function to get size inventory from actual data
  const getSizeInventory = () => {
    if (!product || !inventory?.sizeStock) return [];
    
    return product.sizes.map(size => ({
      size,
      quantity: inventory.sizeStock?.[size] || 0
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Details" />
          <div className="p-6 flex justify-center items-center h-full">
            <p>Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Details" />
          <div className="p-6 flex justify-center items-center h-full flex-col">
            <p className="text-red-500 mb-4">Error: {error || "Product not found"}</p>
            <button
              onClick={() => router.push("/admin/productlist")}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Details" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Product Details</span>
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="relative max-w-4xl w-full">
                <button
                  onClick={closeImageModal}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-200 z-10"
                >
                  <XIcon className="w-6 h-6" />
                </button>
                <img
                  src={selectedImage}
                  alt="Enlarged product view"
                  className="mx-auto max-h-[80vh] max-w-full object-contain"
                />
                {viewingAdditionalImage && (
                  <p className="text-white text-center mt-2 text-sm">
                    Additional view of {product?.gallery[activeImageIndex]?.color} color
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Main Image Grid */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="md:col-span-2 h-96 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
              onClick={viewMainImage}
            >
              {product.gallery.length > 0 && (
                <img
                  src={product.gallery[activeImageIndex]?.src || "/placeholder.png"}
                  alt="Main product"
                  className="w-full h-full object-contain hover:opacity-90 transition-opacity"
                  title="Click to enlarge"
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Color Options</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.gallery.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                        index === activeImageIndex ? "border-orange-500" : "border-gray-200"
                      }`}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={img.src}
                          alt={img.color || `Color option ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-gray-50 text-xs p-1 text-center truncate">{img.color}</div>
                    </div>
                  ))}
                </div>
              </div>

              {product.gallery[activeImageIndex]?.additionalImages &&
                product.gallery[activeImageIndex].additionalImages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Additional Views</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {product.gallery[activeImageIndex].additionalImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="border rounded-md overflow-hidden cursor-pointer hover:border-orange-500 transition-colors"
                          onClick={() => viewAdditionalImage(img.src)}
                          title="Click to enlarge"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={img.src}
                              alt={`Additional view ${idx + 1}`}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all">
                              <span className="text-white text-xs opacity-0 hover:opacity-100">View</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section - Basic Product Info */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="text-xl font-bold text-black">Product Name</span>
                <h1 className="text-2xl mt-1">{product.productName}</h1>
              </div>

              <div className="space-y-2">
                <span className="text-xl font-bold text-black">Description</span>
                <p className="text-gray-700 whitespace-pre-line">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-xl font-bold text-black">Basic Information</span>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Sub Category</span>
                    <p className="font-medium">{product.subCategory}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Regular Price</span>
                    <p className="font-medium text-lg">${product.regularPrice.toFixed(2)}</p>
                  </div>
                  {product.fitType && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-500">Fit Type</span>
                      <p className="font-medium">{product.fitType}</p>
                    </div>
                  )}
                </div>
              </div>

              {product.occasions && product.occasions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xl font-bold text-black">Suitable Occasions</span>
                  <div className="flex flex-wrap gap-2">
                    {product.occasions.map((occasion, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {occasion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.style && product.style.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xl font-bold text-black">Style Attributes</span>
                  <div className="flex flex-wrap gap-2">
                    {product.style.map((style, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.season && product.season.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xl font-bold text-black">Suitable Seasons</span>
                  <div className="flex flex-wrap gap-2">
                    {product.season.map((season, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {season}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xl font-bold text-black">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Inventory & Sizing */}
            <div className="space-y-6">
              {/* Sizing Information Section */}
              <div className="space-y-4">
                <span className="text-xl font-bold text-black">Sizing Information</span>

                
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500 block mb-2">Available Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Status */}
              {inventory && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <span className="text-xl font-bold text-black">Inventory Status</span>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`font-medium px-3 py-1 rounded-full text-sm 
                      ${inventory.status === 'In Stock' ? 'bg-green-100 text-green-800' : 
                        inventory.status === 'Out Of Stock' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {inventory.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Stock</span>
                    <span className="font-medium">{inventory.stock} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Stock Limit</span>
                    <span className="font-medium">{inventory.stockLimit || 'N/A'}</span>
                  </div>
                </div>
              )}

              {/* Size Inventory Table - Now with actual data */}
              {getSizeInventory().length > 0 && (
                <div className="space-y-4">
                  <span className="text-xl font-bold text-black">Inventory by Size</span>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Size</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getSizeInventory().map((item) => (
                          <tr key={item.size}>
                            <td className="px-4 py-3 font-medium">{item.size}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Color Inventory Table - Now with actual data */}
              {getColorInventory().length > 0 && (
                <div className="space-y-4">
                  <span className="text-xl font-bold text-black">Inventory by Color</span>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Color</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getColorInventory().map((color, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span
                                  className="w-4 h-4 rounded-full mr-2"
                                  style={{ backgroundColor: color.name }}
                                ></span>
                                <span>{color.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">{color.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Color x Size Detailed Inventory (if available) */}
              {inventory?.colorSizeStock && Object.keys(inventory.colorSizeStock).length > 0 && (
                <div className="space-y-4">
                  <span className="text-xl font-bold text-black">Detailed Color-Size Inventory</span>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Color</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Size</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(inventory.colorSizeStock).flatMap(([color, sizes]) => 
                          Object.entries(sizes).map(([size, quantity]) => (
                            <tr key={`${color}-${size}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <span 
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: color }}
                                  ></span>
                                  <span>{color}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">{size}</td>
                              <td className="px-4 py-3 text-right">{quantity}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => router.push(`/admin/productedit/${id}`)}
                  className="px-20 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  EDIT
                </button>
                <button
                  onClick={() => inventory ? router.push(`/admin/inventorydetails?id=${inventory._id}`) : null}
                  className={`px-20 py-2 ${inventory ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md transition-colors`}
                >
                  INVENTORY
                </button>
                <button
                  onClick={() => router.push("/admin/productlist")}
                  className="px-20 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  BACK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
