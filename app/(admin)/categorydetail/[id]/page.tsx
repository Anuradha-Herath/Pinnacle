"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import TopBar from "../../../components/TopBar";
import { PencilIcon } from "@heroicons/react/24/solid";

interface Category {
  _id: string;
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  mainCategory: string; // Add mainCategory field
  createdAt: string;
  updatedAt: string;
}

export default function CategoryDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setCategory(data.category);
        
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

  // Loading state
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Category Details" />
          <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !category) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Category Details" />
          <div className="p-6">
            <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p>{error || "Category not found"}</p>
              <button 
                onClick={() => router.push('/categorylist')} 
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
        <TopBar title="Category Details" />
        
        <div className="p-6">
          {/* Breadcrumb Navigation */}
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/categorylist" className="text-gray-600 font-medium hover:text-orange-500">
              Categories
            </Link>{" "}
            &gt;{" "}
            <span className="text-orange-500 font-medium">{category.title}</span>
          </div>

          {/* Category Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{category.title}</h1>
            <button
              onClick={() => router.push(`/categoryedit/${category._id}`)}
              className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <PencilIcon className="h-5 w-5 mr-1" /> Edit
            </button>
          </div>

          {/* Category Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Thumbnail</h2>
              <div className="flex justify-center">
                <img
                  src={category.thumbnailImage || "/placeholder.png"}
                  alt={category.title}
                  className="max-h-48 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
              <h2 className="text-lg font-semibold mb-4">Information</h2>
              <div className="space-y-4">
                {/* Main Category - FIXED VERSION */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Main Category</h3>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    category.mainCategory === 'Men' 
                      ? 'bg-blue-100 text-blue-800' 
                      : category.mainCategory === 'Women' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {category.mainCategory}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="mt-1">{category.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{category.description || "No description provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price Range</h3>
                  <p className="mt-1">{category.priceRange || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
              <h2 className="text-lg font-semibold mb-4">Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1">
                    {new Date(category.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1">
                    {new Date(category.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => router.push("/categorylist")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
