"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductGallery from "@/app/components/ProductGallery";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import { debugLog } from "@/app/utils/debugHelpers";
import { 
  FormInput, 
  FormTextArea, 
  FormSelect, 
  CheckboxButtonGroup,
  SizeChartUploader
} from "./FormComponents";

// Types and interfaces
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

interface ProductFormData {
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: string;
  tag: string;
  sizes: string[];
  gallery: GalleryItem[];
  occasions: string[];
  style: string[];
  season: string[];
  fitType: string;
  sizingTrend: number;
  sizingNotes: string;
  sizeChart: Record<string, any>;
  sizeChartImage: string | ArrayBuffer | null;
}

interface ProductFormProps {
  isEditMode: boolean;
  initialData?: ProductFormData;
  productId?: string;
  title: string;
  breadcrumbTitle: string;
}

// Constants for form options
const MAIN_CATEGORIES = [
  { value: "", label: "Select Main Category" },
  { value: "Men", label: "Men" },
  { value: "Women", label: "Women" },
  { value: "Accessories", label: "Accessories" }
];

const FIT_TYPES = [
  { value: "Slim Fit", label: "Slim Fit" },
  { value: "Regular Fit", label: "Regular Fit" },
  { value: "Relaxed Fit", label: "Relaxed Fit" },
  { value: "Oversized", label: "Oversized" },
  { value: "Tailored", label: "Tailored" }
];

const OCCASION_OPTIONS = [
  { value: "Casual", label: "Casual" },
  { value: "Formal", label: "Formal" },
  { value: "Business", label: "Business" },
  { value: "Party", label: "Party" },
  { value: "Wedding", label: "Wedding" },
  { value: "Beach", label: "Beach" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "Sportswear", label: "Sportswear" }
];

const STYLE_OPTIONS = [
  { value: "Classic", label: "Classic" },
  { value: "Modern", label: "Modern" },
  { value: "Vintage", label: "Vintage" },
  { value: "Bohemian", label: "Bohemian" },
  { value: "Minimalist", label: "Minimalist" },
  { value: "Elegant", label: "Elegant" },
  { value: "Casual", label: "Casual" },
  { value: "Trendy", label: "Trendy" }
];

const SEASON_OPTIONS = [
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
  { value: "Fall", label: "Fall" },
  { value: "Winter", label: "Winter" },
  { value: "All Seasons", label: "All Seasons" }
];

const SIZE_OPTIONS = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" }
];

// Default form data
const DEFAULT_FORM_DATA: ProductFormData = {
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
  sizeChart: {},
  sizeChartImage: null
};

export default function ProductForm({
  isEditMode,
  initialData,
  productId,
  title,
  breadcrumbTitle
}: ProductFormProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredSubCategories, setFilteredSubCategories] = useState<Category[]>([]);
  const [mainProductImage, setMainProductImage] = useState<string | ArrayBuffer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize form data with initialData if available
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      if (initialData.gallery && initialData.gallery.length > 0) {
        setMainProductImage(initialData.gallery[0].src);
      }
    }
  }, [initialData]);

  // Fetch categories from API
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

  // Filter subcategories based on selected category
  useEffect(() => {
    if (formData.category) {
      const filtered = categories.filter(
        (cat) => cat.mainCategory && cat.mainCategory.includes(formData.category)
      );
      setFilteredSubCategories(filtered);
    }
  }, [formData.category, categories]);

  // Form field change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Toggle selection in array fields (like sizes, occasions, etc.)
  const handleToggleItem = useCallback((value: string, field: keyof ProductFormData) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value]
      };
    });
  }, []);

  // Gallery image handlers
  const handleAddImages = useCallback((newItems: GalleryItem[]) => {
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
  }, [mainProductImage]);

  const handleRemoveImage = useCallback((index: number) => {
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
  }, []);

  const handleUpdateColor = useCallback((index: number, color: string) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      updatedGallery[index] = { 
        ...updatedGallery[index], 
        color: color.trim() ? color : updatedGallery[index].color 
      };
      return { ...prev, gallery: updatedGallery };
    });
  }, []);

  const handleAddAdditionalImage = useCallback((colorIndex: number, newImage: AdditionalImage) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      if (!updatedGallery[colorIndex].additionalImages) {
        updatedGallery[colorIndex].additionalImages = [];
      }

      const imageWithId = {
        ...newImage,
        id: newImage.id || `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      };

      const existingIndex = updatedGallery[colorIndex].additionalImages!
        .findIndex(img => img.id === imageWithId.id);

      if (existingIndex >= 0) return prev;

      updatedGallery[colorIndex].additionalImages!.push(imageWithId);
      return { ...prev, gallery: updatedGallery };
    });
  }, []);

  const handleRemoveAdditionalImage = useCallback((colorIndex: number, imageIndex: number) => {
    setFormData((prev) => {
      const updatedGallery = [...prev.gallery];
      if (updatedGallery[colorIndex].additionalImages) {
        updatedGallery[colorIndex].additionalImages!.splice(imageIndex, 1);
      }
      return { ...prev, gallery: updatedGallery };
    });
  }, []);

  // Size chart image handlers
  const handleSizeChartUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, sizeChartImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSizeChartRemove = useCallback(() => {
    setFormData(prev => ({ ...prev, sizeChartImage: null }));
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    if (
      !formData.productName ||
      !formData.category ||
      !formData.regularPrice ||
      !formData.subCategory ||
      (formData.category !== "Accessories" && !(formData.sizes.length > 0)) ||
      formData.gallery.length === 0
    ) {
      alert("Please fill in all required fields and add at least one product image with color!");
      return false;
    }
    
    const missingColorItems = formData.gallery.filter(item => !item.color || item.color.trim() === "");
    if (missingColorItems.length > 0) {
      alert("Please specify a color for all product images. You can select from common colors or enter a custom color name.");
      return false;
    }
    
    return true;
  }, [formData]);

  // Form submission
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      debugLog("Saving product", formData);
      const dataToSend = JSON.parse(JSON.stringify(formData));

      // Ensure additionalImages is never undefined
      dataToSend.gallery = dataToSend.gallery.map((item: GalleryItem) => ({
        ...item,
        additionalImages: item.additionalImages || []
      }));

      const url = isEditMode ? `/api/products/${productId}` : "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? "update" : "create"} product`);
      }
      
      alert(`Product ${isEditMode ? "updated" : "created"} successfully! Redirecting to product list...`);
      setTimeout(() => {
        router.push("/admin/productlist");
      }, 500);
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);
      alert(`Failed to ${isEditMode ? "update" : "create"} product: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (!isClient) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  // Create subcategory options
  const subCategoryOptions = [
    { 
      value: "", 
      label: loadingCategories
        ? "Loading subcategories..."
        : !formData.category
        ? "Select main category first"
        : filteredSubCategories.length === 0
        ? "No subcategories available"
        : "Select Sub Category" 
    },
    ...filteredSubCategories.map(category => ({
      value: category.title,
      label: category.title
    }))
  ];

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title={title} />
        <div className="p-6 mx-auto w-full max-w-6xl">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> {breadcrumbTitle}</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-8">{title}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Form fields */}
            <div className="space-y-6">
              <FormInput
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required={true}
              />
              
              <FormTextArea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
              />

              <FormSelect
                label="Main Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={MAIN_CATEGORIES}
                required={true}
              />

              <FormSelect
                label="Sub Category"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                options={subCategoryOptions}
                required={true}
                disabled={!formData.category || filteredSubCategories.length === 0}
              />
              
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
              
              <FormInput
                label="Regular Price ($)"
                name="regularPrice"
                value={formData.regularPrice}
                onChange={handleChange}
                type="number"
                required={true}
              />
              
              <FormInput
                label="Tag"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
              />

              <CheckboxButtonGroup
                label="Suitable Occasions"
                options={OCCASION_OPTIONS}
                selectedValues={formData.occasions}
                onChange={(value) => handleToggleItem(value, 'occasions')}
                colorScheme="blue"
              />

              <CheckboxButtonGroup
                label="Style Attributes"
                options={STYLE_OPTIONS}
                selectedValues={formData.style}
                onChange={(value) => handleToggleItem(value, 'style')}
                colorScheme="purple"
              />

              <CheckboxButtonGroup
                label="Suitable Seasons"
                options={SEASON_OPTIONS}
                selectedValues={formData.season}
                onChange={(value) => handleToggleItem(value, 'season')}
                colorScheme="green"
              />

              <FormSelect
                label="Fit Type"
                name="fitType"
                value={formData.fitType}
                onChange={handleChange}
                options={FIT_TYPES}
              />

              <FormTextArea
                label="Sizing Notes"
                name="sizingNotes"
                value={formData.sizingNotes}
                onChange={handleChange}
                placeholder="E.g.: This shirt has a slim fit through the chest and shoulders. We recommend sizing up if you prefer a looser fit."
              />

              {formData.category !== "Accessories" && (
                <SizeChartUploader
                  sizeChartImage={formData.sizeChartImage}
                  onUpload={handleSizeChartUpload}
                  onRemove={handleSizeChartRemove}
                />
              )}
            </div>

            {/* Right column - Gallery and sizes */}
            <div className="space-y-6">
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                {mainProductImage ? (
                  <img
                    src={typeof mainProductImage === "string" ? mainProductImage : ''}
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
                <CheckboxButtonGroup
                  label="Size"
                  options={SIZE_OPTIONS}
                  selectedValues={formData.sizes}
                  onChange={(value) => handleToggleItem(value, 'sizes')}
                  required={true}
                  className="mt-4"
                />
              )}
            </div>
          </div>
          
          {/* Buttons */}
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
