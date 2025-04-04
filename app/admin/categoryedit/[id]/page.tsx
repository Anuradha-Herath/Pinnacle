"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import TopBar from "../../../components/TopBar";
import { PhotoIcon } from "@heroicons/react/24/solid";

interface Category {
  _id: string;
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  mainCategory: string;
}

export default function CategoryEdit() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [categoryTitle, setCategoryTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainCategory, setMainCategory] = useState<string>("");

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/categories/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch category");
        }
        
        const data = await response.json();
        const category = data.category;
        
        // Set form fields
        setCategoryTitle(category.title);
        setDescription(category.description || "");
        setPriceRange(category.priceRange || "");
        setMainCategory(category.mainCategory || "");
        setOriginalThumbnailUrl(category.thumbnailImage || null);
        
      } catch (error) {
        console.error("Error fetching category:", error);
        setError(error instanceof Error ? error.message : "Failed to load category");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCategory();
    }
  }, [id]);

  // Handle thumbnail image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleUpdateCategory = async () => {
    if (!categoryTitle.trim() || !mainCategory) {
      alert("Category title and main category are required!");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: categoryTitle,
          description,
          priceRange,
          thumbnailImage: thumbnailImage || originalThumbnailUrl,
          mainCategory // Include main category
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      // Success - redirect to category list
      alert('Category updated successfully!');
      router.push("/admin/categorylist");
      
    } catch (error) {
      console.error("Error updating category:", error);
      alert(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      // Success - redirect to category list
      alert('Category deleted successfully!');
      router.push("/admin/categorylist");
      
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Edit Category" />
          <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Edit Category" />
          <div className="p-6">
            <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p>{error}</p>
              <button 
                onClick={() => router.push('/admin/categorylist')} 
                className="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                Back to Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 flex-1">
        <TopBar title="Edit Category" />
        
        <div className="p-6">
          {/* Breadcrumb Navigation */}
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/admin/categorylist" className="text-gray-600 font-medium hover:text-orange-500">
              Categories
            </Link>{" "}
            &gt;{" "}
            <span className="text-orange-500 font-medium">{categoryTitle}</span>
          </div>

          {/* Category Thumbnail Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Category Thumbnail</h2>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {thumbnailImage || originalThumbnailUrl ? (
              <div className="relative h-48 mb-3">
                <img 
                  src={thumbnailImage || originalThumbnailUrl || '/placeholder.png'} 
                  alt="Category Thumbnail" 
                  className="h-full w-auto mx-auto object-contain" 
                />
                <button 
                  onClick={() => {
                    setThumbnailImage(null);
                    if (thumbnailImage) {
                      // If we're showing an uploaded image, revert to original
                      // Otherwise, clear everything
                      setOriginalThumbnailUrl(null);
                    }
                  }} 
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center h-48 flex flex-col justify-center items-center cursor-pointer hover:border-orange-500 transition-colors"
              >
                <PhotoIcon className="h-10 w-10 text-orange-500 mb-2" />
                <p className="text-gray-500">Drop your image here, or click to upload</p>
                <p className="text-gray-500">JPEG, PNG, GIF allowed</p>
              </div>
            )}
          </div>

          {/* Category Information Form */}
          <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Category Information</h2>
            <div className="space-y-4">
              {/* Main Category Dropdown - New Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={mainCategory}
                  onChange={(e) => setMainCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="" disabled>Select a main category</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter category title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter category description"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <input
                  type="text"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. $10-$100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-6 max-w-3xl mx-auto space-x-3">
            <button
              onClick={handleDeleteCategory}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors"
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? 'PROCESSING...' : 'DELETE'}
            </button>
            
            <button
              onClick={() => router.push("/admin/categorylist")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
              disabled={isSubmitting}
              type="button"
            >
              CANCEL
            </button>
            
            <button
              onClick={handleUpdateCategory}
              className={`bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? 'UPDATING...' : 'UPDATE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
