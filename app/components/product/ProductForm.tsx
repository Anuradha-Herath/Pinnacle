import React from "react";
import { useRouter } from "next/navigation";
import { useProductForm, initialProductFormData } from "@/app/hooks/product/useProductForm";
import ProductBasicInfoForm from "./ProductBasicInfoForm";
import ProductAttributesForm from "./ProductAttributesForm";
import SizeChartUploader from "./SizeChartUploader";
import SizeSelector from "./SizeSelector";
import ProductGallery from "./ProductGallery";

interface ProductFormProps {
  initialData?: typeof initialProductFormData;
  isEdit?: boolean;
  productId?: string;
}

export default function ProductForm({ 
  initialData = initialProductFormData, 
  isEdit = false, 
  productId 
}: ProductFormProps) {
  const router = useRouter();
  const { 
    formData,
    mainProductImage,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleSizeChange,
    handleArrayFieldToggle,
    handleAddImages,
    handleRemoveImage,
    handleUpdateColor,
    handleAddAdditionalImage,
    handleRemoveAdditionalImage,
    handleSizeChartUpload
  } = useProductForm(initialData);

  const handleSave = async () => {
    // Perform validation
    const missingColorItems = formData.gallery.filter(item => !item.color || item.color.trim() === "");
    
    // Check required fields
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
    
    // Check for missing colors
    if (missingColorItems.length > 0) {
      alert("Please specify a color for all product images. You can select from common colors or enter a custom color name.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const dataToSend = JSON.parse(JSON.stringify(formData));
      
      dataToSend.gallery = dataToSend.gallery.map((item: any) => ({
        ...item,
        additionalImages: item.additionalImages || []
      }));

      // Make API request
      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} product`);
      }
      
      alert(`Product ${isEdit ? 'updated' : 'created'} successfully! Redirecting to product list...`);
      setTimeout(() => {
        router.push("/admin/productlist");
      }, 500);
      
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'saving'} product:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'save'} product: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ProductBasicInfoForm 
            productName={formData.productName}
            description={formData.description}
            category={formData.category}
            subCategory={formData.subCategory}
            regularPrice={formData.regularPrice}
            tag={formData.tag}
            onChange={handleChange}
          />
          
          <ProductAttributesForm
            occasions={formData.occasions}
            style={formData.style}
            season={formData.season}
            fitType={formData.fitType}
            sizingNotes={formData.sizingNotes}
            onChangeText={handleChange}
            onToggleOccasion={(value) => handleArrayFieldToggle("occasions", value)}
            onToggleStyle={(value) => handleArrayFieldToggle("style", value)}
            onToggleSeason={(value) => handleArrayFieldToggle("season", value)}
          />
          
          {formData.category !== "Accessories" && (
            <SizeChartUploader
              sizeChartImage={formData.sizeChartImage}
              onUpload={handleSizeChartUpload}
              onRemove={() => {
                handleChange({ target: { name: 'sizeChartImage', value: null } });
              }}
            />
          )}
        </div>

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
            colorRequired={true}
            allowMultipleAdditionalImages={true}
          />
          
          {formData.category !== "Accessories" && (
            <SizeSelector 
              sizes={formData.sizes}
              onChange={handleSizeChange}
            />
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
    </>
  );
}
