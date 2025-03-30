"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import Image from "next/image";

interface ProductData {
  _id: string;
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: number;
  tag: string;
  sizes: string[];
  gallery: { src: string; color: string; name: string }[];
  // Additional fields that might not exist in all products
  colors?: { name: string; quantity: number }[];
  inventory?: Record<string, number>;
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductData();
  }, [id]);

  // Generate inventory data from sizes
  const sizeInventory = product?.sizes.map(size => ({
    size: size,
    quantity: Math.floor(Math.random() * 300) + 100 // Random inventory between 100-400 for example
  })) || [];
  
  // Generate color data from gallery if colors don't exist
  const colorInventory = product?.gallery.map(item => ({
    name: item.color,
    quantity: Math.floor(Math.random() * 300) + 100 // Random inventory between 100-400
  })) || [];

  // Parse tags from the tag string
  const tags = product?.tag ? product.tag.split(',').map(tag => tag.trim()) : [];

  // Handle loading state
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

  // Handle error state
  if (error || !product) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Details" />
          <div className="p-6 flex justify-center items-center h-full flex-col">
            <p className="text-red-500 mb-4">Error: {error || "Product not found"}</p>
            <button 
              onClick={() => router.push('/admin/productlist')}
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

          {/* Image Gallery */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            {/* Main Image */}
            <div className="col-span-2 h-96 rounded-lg overflow-hidden">
              <img
                src={product.gallery[0]?.src || '/placeholder.png'}
                alt="Main product"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-2 gap-4">
              {product.gallery.slice(1, 5).map((img, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-md">
                  <img
                    src={img.src}
                    alt={`Thumbnail ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {/* Add placeholder thumbnails if less than 4 images */}
              {Array(Math.max(0, 4 - product.gallery.slice(1).length)).fill(0).map((_, index) => (
                <div key={`placeholder-${index}`} className="aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section */}
            <div className="space-y-6">
              {/* Product Name Section */}
              <div className="space-y-2">
                <span className="text-xl font-bold text-black">Product Name</span>
                <h1 className="text-base">{product.productName}</h1>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <span className="text-xl font-bold text-black">Description</span>
                <p className="text-black whitespace-pre-line">{product.description}</p>
              </div>

              {/* Product Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-black">Category</span>
                    <p className="font-medium">{product.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-black">Sub Category</span>
                    <p className="font-medium">{product.subCategory}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-xl font-bold text-black">Regular Price</span>
                    <p className="text-xl">${product.regularPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xl font-bold text-black">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-black rounded-full text-sm text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section */}
            <div className="space-y-6">
              {/* Size Table */}
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Size</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sizeInventory.map((item) => (
                        <tr key={item.size}>
                          <td className="px-4 py-3 font-medium text-center">{item.size}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Color Table */}
              {colorInventory.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Color</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {colorInventory.map((color) => (
                          <tr key={color.name}>
                            <td className="px-4 py-3 text-center">{color.name}</td>
                            <td className="px-4 py-3 text-center">{color.quantity}</td>
                          </tr>
                        ))}
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
                  onClick={() => router.push('/admin/productlist')}
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
