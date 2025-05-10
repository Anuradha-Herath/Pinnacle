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
  const [priceRange, setPriceRange] = useState(""); // Price range in LKR
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Handle checkbox changes for category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  // Handle form submission
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      setError("Please select at least one main category");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: categoryTitle,
          description,
          priceRange,
          thumbnailImage,
          mainCategory: selectedCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 500 &&
          data.error &&
          data.error.includes("duplicate key error")
        ) {
          throw new Error(
            `A category with the title "${categoryTitle}" already exists. Please use a different title.`
          );
        }
        throw new Error(data.error || "Failed to create category");
      }

      alert("Category created successfully!");
      router.push("/categorylist");
    } catch (error) {
      console.error("Error creating category:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
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
            <Link
              href="/categorylist"
              className="text-gray-600 font-medium hover:text-orange-500"
            >
              Categories
            </Link>{" "}
            &gt; <span className="text-orange-500 font-medium">Create</span>
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
                <p className="text-gray-500">
                  Drop your image here, or click to upload
                </p>
                <p className="text-gray-500">JPEG, PNG, GIF allowed</p>
              </div>
            )}
          </div>

          {/* General Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">General Information</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateCategory}>
              <div className="space-y-4">
                {/* Main Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Category (Select at least one)
                  </label>
                  <div className="flex space-x-60">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-men"
                        checked={selectedCategories.includes("Men")}
                        onChange={() => handleCategoryChange("Men")}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded bg-orange-500 checked:bg-orange-500"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="category-men"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Men
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-women"
                        checked={selectedCategories.includes("Women")}
                        onChange={() => handleCategoryChange("Women")}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded bg-orange-500 checked:bg-orange-500"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="category-women"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Women
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-accessories"
                        checked={selectedCategories.includes("Accessories")}
                        onChange={() => handleCategoryChange("Accessories")}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded bg-orange-500 checked:bg-orange-500"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="category-accessories"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Accessories
                      </label>
                    </div>
                  </div>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range (in LKR)
                  </label>
                  <input
                    type="text"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Rs. 1000 - Rs. 5000"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 max-w-3xl mx-auto">
                <button
                  type="button"
                  onClick={() => router.push("/categorylist")}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors mr-4"
                  disabled={isSubmitting}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className={`bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-colors ${
                    isSubmitting ? "opacity-70 cursor-wait" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "CREATING..." : "CREATE CATEGORY"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}