"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";

interface Category {
  _id: string;
  title: string;
  description?: string;
  priceRange?: string;
  thumbnailImage?: string;
  mainCategory: string[]; // Changed from string to array of strings
  createdAt: string;
}

export default function CategoryList() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All"); // Add filter state

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle category deletion
  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete category");
        }

        // Remove the category from the list
        setCategories(categories.filter((category) => category._id !== id));

        alert("Category deleted successfully");
      } catch (error) {
        console.error("Error deleting category:", error);
        alert(error instanceof Error ? error.message : "Failed to delete category");
      }
    }
  };

  // Get filtered categories - updated to handle array of categories
  const filteredCategories = filter === "All"
    ? categories
    : categories.filter(category => category.mainCategory.includes(filter));

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 flex-1">
        <TopBar title="Category List" />

        <div className="p-6">
          {/* Header with Filter */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Categories</h1>

              {/* Main Category Filter */}
              <div className="ml-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => router.push("/categorycreate")}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Add New Category
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && categories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h2 className="text-xl font-medium mb-2">No categories found</h2>
              <p className="text-gray-500 mb-6">
                Create a new category to get started.
              </p>
              <button
                onClick={() => router.push("/categorycreate")}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              >
                Add New Category
              </button>
            </div>
          )}

          {/* Categories Table */}
          {!loading && !error && filteredCategories.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thumbnail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Main Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 overflow-hidden rounded-md">
                          <img
                            src={category.thumbnailImage || "/placeholder.png"}
                            alt={category.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.png";
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{category.title}</div>
                      </td>
                      {/* Updated Main Category cell to display multiple categories */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {category.mainCategory.map((cat) => (
                            <span
                              key={cat}
                              className={`px-2 py-1 rounded-full text-xs ${
                                cat === "Men"
                                  ? "bg-blue-100 text-blue-800"
                                  : cat === "Women"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate">
                          {category.description || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{category.priceRange || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              router.push(`/categorydetail/${category._id}`)
                            }
                            className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/categoryedit/${category._id}`)
                            }
                            className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                            aria-label={`Edit ${category.title}`}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="p-2 bg-orange-500 text-white rounded-md shadow-md hover:bg-orange-600"
                            aria-label={`Delete ${category.title}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
