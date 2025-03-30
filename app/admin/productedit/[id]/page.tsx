"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import ProductGallery from "@/app/components/ProductGallery";

interface AdditionalImage {
  id: string;
  src: string | ArrayBuffer | null;
  name: string;
}

interface GalleryItem {
  src: string | ArrayBuffer | null;
  name: string;
  color: string;
  additionalImages?: AdditionalImage[];
}

interface Category {
  _id: string;
  title: string;
  mainCategory: string[];
}

export default function ProductEdit() {
  const router = useRouter();
  const { id } = useParams();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    subCategory: "",
    regularPrice: "1000",
    tag: "",
    sizes: [],
    gallery: [],
    occasions: [],
    style: [],
    season: [],
    fitType: "Regular Fit",
    sizingTrend: 0,
    sizingNotes: "",
    sizeChart: {}
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState<Category[]>([]);
  const [mainProductImage, setMainProductImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category) {
      const filtered = categories.filter(
        (cat) => cat.mainCategory && cat.mainCategory.includes(formData.category)
      );
      setFilteredSubCategories(filtered);
    }
  }, [formData.category, categories]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        const product = data.product;
        setFormData({
          productName: product.productName,
          description: product.description || "",
          category: product.category,
          subCategory: product.subCategory,
          regularPrice: String(product.regularPrice),
          tag: product.tag || "",
          sizes: product.sizes || [],
          gallery: product.gallery || [],
          occasions: product.occasions || [],
          style: product.style || [],
          season: product.season || [],
          fitType: product.fitType || "Regular Fit",
          sizingTrend: product.sizingTrend || 0,
          sizingNotes: product.sizingNotes || "",
          sizeChart: product.sizeChart || {}
        });
        if (product.gallery && product.gallery.length > 0) {
          setMainProductImage(product.gallery[0].src);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e: { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleAddImages = (newItems: any[]) => {
    const processedItems = newItems.map(item => ({
      ...item,
      additionalImages: item.additionalImages || []
    }));
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery, ...processedItems];
      if (updatedGallery.length > 0 && !mainProductImage) {
        setMainProductImage(updatedGallery[0].src);
      }
      return { ...prev, gallery: updatedGallery };
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      updatedGallery.splice(index, 1);
      if (index === 0 && updatedGallery.length > 0) {
        setMainProductImage(updatedGallery[0].src);
      } else if (updatedGallery.length === 0) {
        setMainProductImage(null);
      }
      return { ...prev, gallery: updatedGallery };
    });
  };

  const handleUpdateColor = (index: number, color: string) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      updatedGallery[index] = { ...updatedGallery[index], color };
      return { ...prev, gallery: updatedGallery };
    });
  };

  const handleAddAdditionalImage = (colorIndex: number, newImage: any) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      if (!updatedGallery[colorIndex].additionalImages) {
        updatedGallery[colorIndex].additionalImages = [];
      }
      const exists = updatedGallery[colorIndex].additionalImages.some((img: any) => img.id === newImage.id);
      if (!exists) {
        updatedGallery[colorIndex].additionalImages.push(newImage);
      }
      return { ...prev, gallery: updatedGallery };
    });
  };

  const handleRemoveAdditionalImage = (colorIndex: number, imageIndex: number) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      if (updatedGallery[colorIndex].additionalImages) {
        updatedGallery[colorIndex].additionalImages.splice(imageIndex, 1);
      }
      return { ...prev, gallery: updatedGallery };
    });
  };

  const handleSave = async () => {
    if (
      !formData.productName ||
      !formData.category ||
      !formData.regularPrice ||
      !formData.subCategory ||
      (formData.category !== "Accessories" && !(formData.sizes.length > 0)) ||
      formData.gallery.length === 0
    ) {
      alert("Please fill in all required fields and add at least one product image with color!");
      return;
    }
    const missingColorItems = formData.gallery.filter(item => !item.color || item.color.trim() === "");
    if (missingColorItems.length > 0) {
      alert("Please specify a color for all product images.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update product");
      }
      alert("Product updated successfully! Redirecting to product list...");
      setTimeout(() => {
        router.push("/admin/productlist");
      }, 500);
    } catch (error) {
      console.error("Error updating product:", error);
      alert(`Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  if (!isClient) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (isLoading) return <p>Loading product data...</p>;

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Edit" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Edit Product</span>
          </div>
          <h1 className="text-2xl font-bold mb-8">Edit Product</h1>
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sub Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={
                    !formData.category || filteredSubCategories.length === 0
                  }
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading subcategories..."
                      : !formData.category
                      ? "Select main category first"
                      : filteredSubCategories.length === 0
                      ? "No subcategories available"
                      : "Select Sub Category"}
                  </option>
                  {filteredSubCategories.map((category) => (
                    <option key={category._id} value={category.title}>
                      {category.title}
                    </option>
                  ))}
                </select>
                {formData.category &&
                  filteredSubCategories.length === 0 &&
                  !loadingCategories && (
                    <div className="text-sm text-orange-500 mt-1">
                      No subcategories found for {formData.category}.{" "}
                      <a href="/admin/categorycreate" className="underline">
                        Create one
                      </a>
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  Suitable Occasions
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Casual",
                    "Formal",
                    "Business",
                    "Party",
                    "Wedding",
                    "Beach",
                    "Outdoor",
                    "Sportswear",
                  ].map((occasion) => (
                    <label key={occasion} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.occasions.includes(occasion)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            occasions: prev.occasions.includes(occasion)
                              ? prev.occasions.filter((o) => o !== occasion)
                              : [...prev.occasions, occasion],
                          }));
                        }}
                        className="hidden"
                      />
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                          formData.occasions.includes(occasion)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {occasion}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Style Attributes
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Classic",
                    "Modern",
                    "Vintage",
                    "Bohemian",
                    "Minimalist",
                    "Elegant",
                    "Casual",
                    "Trendy",
                  ].map((style) => (
                    <label key={style} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.style.includes(style)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            style: prev.style.includes(style)
                              ? prev.style.filter((s) => s !== style)
                              : [...prev.style, style],
                          }));
                        }}
                        className="hidden"
                      />
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                          formData.style.includes(style)
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {style}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Suitable Seasons
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Spring",
                    "Summer",
                    "Fall",
                    "Winter",
                    "All Seasons",
                  ].map((season) => (
                    <label key={season} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.season.includes(season)}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            season: prev.season.includes(season)
                              ? prev.season.filter((s) => s !== season)
                              : [...prev.season, season],
                          }));
                        }}
                        className="hidden"
                      />
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                          formData.season.includes(season)
                            ? "bg-green-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {season}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fit Type
                </label>
                <select
                  name="fitType"
                  value={formData.fitType}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Slim Fit">Slim Fit</option>
                  <option value="Regular Fit">Regular Fit</option>
                  <option value="Relaxed Fit">Relaxed Fit</option>
                  <option value="Oversized">Oversized</option>
                  <option value="Tailored">Tailored</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Size Accuracy
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sizingTrend"
                      value={-1}
                      checked={formData.sizingTrend === -1}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, sizingTrend: -1 }))
                      }
                      className="mr-2"
                    />
                    <span>Runs Small</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sizingTrend"
                      value={0}
                      checked={formData.sizingTrend === 0}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, sizingTrend: 0 }))
                      }
                      className="mr-2"
                    />
                    <span>True to Size</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sizingTrend"
                      value={1}
                      checked={formData.sizingTrend === 1}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, sizingTrend: 1 }))
                      }
                      className="mr-2"
                    />
                    <span>Runs Large</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sizing Notes
                </label>
                <textarea
                  name="sizingNotes"
                  value={formData.sizingNotes}
                  onChange={handleChange}
                  placeholder="E.g.: This shirt has a slim fit through the chest and shoulders. We recommend sizing up if you prefer a looser fit."
                  className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </form>
            <div className="space-y-6">
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                {mainProductImage ? (
                  <img
                    src={typeof mainProductImage === "string" ? mainProductImage : undefined}
                    alt="Main Product"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-gray-500">Main Product Image</span>
                )}
              </div>
              <ProductGallery
                gallery={formData.gallery}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
                onUpdateColor={handleUpdateColor}
                onAddAdditionalImage={handleAddAdditionalImage}
                onRemoveAdditionalImage={handleRemoveAdditionalImage}
              />
              {formData.category !== "Accessories" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["NS", "XS", "S", "M", "L", "XL", "2XL", "3XL"].map(size => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                          className="hidden"
                        />
                        <span className={`inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${formData.sizes.includes(size) ? "bg-gray-500 text-white" : "bg-gray-300"}`}>
                          {size}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.push("/admin/productlist")}
              className="px-20 py-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-20 py-2 ${isSubmitting ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"} text-white rounded-md transition-colors`}
            >
              {isSubmitting ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
