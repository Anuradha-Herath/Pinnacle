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
  mainCategory: string[]; // Updated: now an array of strings
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
    occasions: string[]; // New field for occasions
    style: string[];     // New field for style attributes
    season: string[];    // New field for seasons
    fitType: string;
    sizingTrend: number;
    sizingNotes: string;
    sizeChart: Record<string, { chest?: number, waist?: number, hips?: number, length?: number }>;
  }>({
    productName: "",
    description: "",
    category: "",
    subCategory: "",
    regularPrice: "1000",
    tag: "",
    sizes: [],
    gallery: [],
    occasions: [], // Initialize empty occasions array
    style: [],     // Initialize empty style array
    season: [],    // Initialize empty season array
    fitType: "Regular Fit",
    sizingTrend: 0,
    sizingNotes: "",
    sizeChart: {},
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
      // Update this filter to check if the selected category is in the mainCategory array
      const filtered = categories.filter(cat => 
        cat.mainCategory && cat.mainCategory.includes(formData.category)
      );
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
    // Ensure each gallery item has valid color information
    const galleryWithColors = newGallery.map(item => {
      // If color is empty, set a default value based on the file name
      // This helps the chatbot recognize colors even if admin didn't set them explicitly
      if (!item.color || item.color.trim() === '') {
        const colorKeywords = ['red', 'blue', 'green', 'black', 'white', 'yellow', 
                              'purple', 'pink', 'orange', 'brown', 'grey', 'gray'];
        
        // Check if the filename contains any color keywords
        const fileName = item.name.toLowerCase();
        const detectedColor = colorKeywords.find(color => fileName.includes(color));
        
        return {
          ...item,
          color: detectedColor || 'default' // Use detected color or set to 'default'
        };
      }
      return item;
    });
    
    setFormData((prev) => ({ ...prev, gallery: galleryWithColors }));
    if (galleryWithColors.length > 0 && !mainProductImage) {
      setMainProductImage(galleryWithColors[0].src);
    } else if (galleryWithColors.length === 0) {
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

    // Validate that all gallery items have color information
    const missingColorItems = formData.gallery.filter(item => !item.color || item.color.trim() === '');
    if (missingColorItems.length > 0) {
      alert("Please specify a color for all product images. Colors help customers identify products and improve search results.");
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

              {/* Add occasion selector after the Tag input field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Suitable Occasions
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Casual", "Formal", "Business", "Party", "Wedding", "Beach", "Outdoor", "Sportswear"].map(
                    (occasion) => (
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
                    )
                  )}
                </div>
              </div>

              {/* Style attributes selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Style Attributes
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Classic", "Modern", "Vintage", "Bohemian", "Minimalist", "Elegant", "Casual", "Trendy"].map(
                    (style) => (
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
                    )
                  )}
                </div>
              </div>

              {/* Season selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Suitable Seasons
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Spring", "Summer", "Fall", "Winter", "All Seasons"].map(
                    (season) => (
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
                    )
                  )}
                </div>
              </div>

              {/* Add new Fit Type selector */}
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
              
              {/* Sizing Trend Selector */}
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
                      onChange={() => setFormData(prev => ({ ...prev, sizingTrend: -1 }))}
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
                      onChange={() => setFormData(prev => ({ ...prev, sizingTrend: 0 }))}
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
                      onChange={() => setFormData(prev => ({ ...prev, sizingTrend: 1 }))}
                      className="mr-2"
                    />
                    <span>Runs Large</span>
                  </label>
                </div>
              </div>
              
              {/* Sizing Notes */}
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
