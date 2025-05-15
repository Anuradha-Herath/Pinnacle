import { useState, useCallback } from "react";

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

export const initialProductFormData: ProductFormData = {
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

export function useProductForm(initialData: ProductFormData = initialProductFormData) {
  const [formData, setFormData] = useState<ProductFormData>(initialData);
  const [mainProductImage, setMainProductImage] = useState<string | ArrayBuffer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic form field change handler
  const handleChange = useCallback((e: { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Size selection handler
  const handleSizeChange = useCallback((size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size]
    }));
  }, []);

  // Toggle selection for array-based fields (occasions, style, season)
  const handleArrayFieldToggle = useCallback((fieldName: "occasions" | "style" | "season", value: string) => {
    setFormData((prev) => {
      const currentArray = prev[fieldName];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      
      return { ...prev, [fieldName]: newArray };
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
      
      const existingImageIndex = updatedGallery[colorIndex].additionalImages!
        .findIndex(img => img.id === imageWithId.id);
      
      if (existingImageIndex >= 0) {
        return prev;
      }
      
      updatedGallery[colorIndex].additionalImages!.push(imageWithId);
      
      return {
        ...prev,
        gallery: updatedGallery
      };
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

  // Size chart image upload handler
  const handleSizeChartUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          sizeChartImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  return {
    formData,
    setFormData,
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
  };
}
