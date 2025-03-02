"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { PhotoIcon } from "@heroicons/react/24/solid";

export default function CategoryCreate() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [categoryTitle, setCategoryTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handleCreateCategory = async () => {
    if (!categoryTitle.trim()) {
      alert("Category title is required!");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: categoryTitle,
          description,
          priceRange,
          thumbnailImage
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }
      
      // Success - redirect to category list
      alert('Category created successfully!');
      router.push("/categorylist");
      
    } catch (error) {
      console.error("Error creating category:", error);
      alert(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 flex-1">
        <TopBar title="Create Category" />
        
        <div className="p-6">
          {/* Breadcrumb Navigation */}
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/categorylist" className="text-gray-600 font-medium hover:text-orange-500">
              Categories
            </Link>{" "}
            &gt;{" "}
            <span className="text-orange-500 font-medium">Create</span>
          </div>

          {/* Add Thumbnail Photo Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Add Thumbnail Photo</h2>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {thumbnailImage ? (
              <div className="relative h-48 mb-3">
                <img 
                  src={thumbnailImage} 
                  alt="Category Thumbnail" 
                  className="h-full w-auto mx-auto object-contain" 
                />
                <button 
                  onClick={() => setThumbnailImage(null)} 
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
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

          {/* General Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">General Information</h2>
            <div className="space-y-4">
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
          <div className="flex justify-end mt-6 max-w-3xl mx-auto">
            <button
              onClick={() => router.push("/categorylist")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors mr-4"
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              onClick={handleCreateCategory}
              className={`bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'CREATING...' : 'CREATE CATEGORY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}