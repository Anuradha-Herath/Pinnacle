"use client";
import { useState, useRef, useEffect } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import ProductGallery from "@/app/components/ProductGallery";
import { useRouter } from "next/navigation";

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
}

interface Category {
  _id: string;
  title: string;
  mainCategory: string;
}

export default function ProductCreate() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    productName: string;
    description: string;
    category: string; // This will now be the main category
    subCategory: string; // This will be the category title from our category system
    regularPrice: string;
    tag: string;
    sizes: string[];
    gallery: GalleryItem[];
  }>({
    productName: "",
    description: "",
    category: "",
    subCategory: "",
    regularPrice: "1000",
    tag: "",
    sizes: [],
    gallery: [],
  });

  // State for storing all categories fetched from the API
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to track which subcategories to show based on selected main category
  const [filteredSubCategories, setFilteredSubCategories] = useState<Category[]>([]);

  // Fetch all categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update filtered subcategories when main category changes
  useEffect(() => {
    if (formData.category) {
      const filtered = categories.filter(cat => cat.mainCategory === formData.category);
      setFilteredSubCategories(filtered);
      
      // Reset subcategory selection when main category changes
      setFormData(prev => ({
        ...prev,
        subCategory: ''
      }));
    }
  }, [formData.category, categories]);

  const [mainProductImage, setMainProductImage] = useState<
    string | ArrayBuffer | null
  >(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleGalleryChange = (newGallery: GalleryItem[]) => {
    setFormData((prev) => ({ ...prev, gallery: newGallery }));
    if (newGallery.length > 0 && !mainProductImage) {
      setMainProductImage(newGallery[0].src);
    } else if (newGallery.length === 0) {
      setMainProductImage(null);
    }
  };

  const handleMainImageRemove = (index: number) => {
    if (index === 0 && formData.gallery.length > 1) {
      setMainProductImage(formData.gallery[1].src);
    } else if (formData.gallery.length <= 1) {
      setMainProductImage(null);
    }
  };

  const handleSave = async () => {
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

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const result = await response.json();
      console.log("Product created:", result);
      alert("Product saved successfully!");
      
      // Redirect to product list page
      router.push('/productlist');
      
    } catch (error) {
      console.error("Error saving product:", error);
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Create" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Add New Product</span>
          </div>
          <h1 className="text-2xl font-bold mb-8">Add New Product</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              {/* Main Category Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Main Category</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              
              {/* Sub Category Dropdown - populated from categories */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.category || filteredSubCategories.length === 0}
                >
                  <option value="">
                    {loading 
                      ? 'Loading subcategories...' 
                      : !formData.category 
                      ? 'Select main category first' 
                      : filteredSubCategories.length === 0 
                      ? 'No subcategories available' 
                      : 'Select Sub Category'}
                  </option>
                  {filteredSubCategories.map((category) => (
                    <option key={category._id} value={category.title}>
                      {category.title}
                    </option>
                  ))}
                </select>
                {formData.category && filteredSubCategories.length === 0 && !loading && (
                  <div className="text-sm text-orange-500 mt-1">
                    No subcategories found for {formData.category}. <a href="/categorycreate" className="underline">Create one</a>
                  </div>
                )}
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
            <div className="space-y-6">
              {/* Rest of the component remains the same */}
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                {mainProductImage ? (
                  <img
                    src={
                      typeof mainProductImage === "string"
                        ? mainProductImage
                        : undefined
                    }
                    alt="Main Product"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-gray-500">Main Product Image</span>
                )}
              </div>
              <ProductGallery
                onGalleryChange={handleGalleryChange}
                onMainImageRemove={handleMainImageRemove}
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
                              ? "bg-gray-500 text-white"
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
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.push('/productlist')}
              className="px-20 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-20 py-2 ${isSubmitting ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-md transition-colors`}
            >
              {isSubmitting ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
