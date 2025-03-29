"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import ProductGalleryForEdit from "@/app/components/ProductGalleryForEdit";

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

interface ProductData {
  _id: string;
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: string;
  tag: string;
  sizes: string[];
  gallery: GalleryItem[];
}

export default function ProductEdit() {
  const router = useRouter();
  // Use the useParams hook instead of accessing params directly
  const params = useParams();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductData>({
    _id: '',
    productName: '',
    description: '',
    category: '',
    subCategory: '',
    regularPrice: '',
    tag: '',
    sizes: [],
    gallery: []
  });

  const [mainProductImage, setMainProductImage] = useState<string | ArrayBuffer | null>(null);

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        
        // Format the data to match our form structure
        setFormData({
          _id: data.product._id,
          productName: data.product.productName,
          description: data.product.description || '',
          category: data.product.category,
          subCategory: data.product.subCategory,
          regularPrice: data.product.regularPrice.toString(),
          tag: data.product.tag || '',
          sizes: data.product.sizes || [],
          gallery: data.product.gallery || []
        });
        
        // Set main product image if gallery exists
        if (data.product.gallery && data.product.gallery.length > 0) {
          setMainProductImage(data.product.gallery[0].src);
        }
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductData();
  }, [id]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleImageRemove = (index: number) => {
    const newGallery = formData.gallery.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, gallery: newGallery }));
    
    if (index === 0 && newGallery.length > 0) {
      setMainProductImage(newGallery[0].src);
    } else if (newGallery.length === 0) {
      setMainProductImage(null);
    }
  };

  const handleGalleryUpdate = (newGallery: GalleryItem[]) => {
    setFormData(prev => ({ ...prev, gallery: newGallery }));
    if (!mainProductImage && newGallery.length > 0) {
      setMainProductImage(newGallery[0].src);
    }
  };

  const handleUpdate = async () => {
    // Validation
    if (
      !formData.productName ||
      !formData.category ||
      !formData.regularPrice ||
      !formData.subCategory ||
      !(formData.sizes.length > 0) ||
      formData.gallery.length === 0
    ) {
      alert(
        "Please fill in all required fields (Product Name, Sizes, Category, Sub-Category, Regular Price) and add at least one product image with color!"
      );
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      alert("Product updated successfully!");
      router.push('/productlist');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      alert("Product deleted successfully!");
      router.push('/productlist');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Edit" />
          <div className="p-6 flex justify-center items-center h-full">
            <p>Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Edit" />
          <div className="p-6 flex justify-center items-center h-full flex-col">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button 
              onClick={() => router.push('/productlist')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // The render JSX remains the same
  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Edit" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          {/* ...existing code... */}
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Edit Product</span>
          </div>
          <h1 className="text-2xl font-bold mb-8">Edit Product</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Fields */}
            <form className="space-y-6">
              {/* ...existing form fields... */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ...more form fields... */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Regular Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="regularPrice"
                  value={formData.regularPrice}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Image and Size Section */}
            <div className="space-y-6">
              {/* ...existing image and size section... */}
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                {mainProductImage ? (
                  <img
                    src={mainProductImage.toString()}
                    alt="Main Product"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">Main Product Image</span>
                )}
              </div>

              <ProductGalleryForEdit
                gallery={formData.gallery}
                onGalleryUpdate={handleGalleryUpdate}
                onImageRemove={handleImageRemove}
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Size <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {["NS", "XS", "S", "M", "L", "XL", "2XL", "3XL"].map(
                    (size) => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                          className="hidden"
                        />
                        <span
                          className={`inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                            formData.sizes.includes(size)
                              ? "bg-gray-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {size}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end w-full mt-6 space-x-4">
            <button
              type="button"
              onClick={handleUpdate}
              className="px-11 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              UPDATE
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-11 py-2 bg-orange-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              DELETE
            </button>
            <button
              type="button"
              onClick={() => router.push('/productlist')}
              className="px-11 py-2 border border-black rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
