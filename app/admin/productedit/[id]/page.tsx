"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/app/components/products/ProductForm";
import { debugLog } from "@/app/utils/debugHelpers";

export default function ProductEdit() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  debugLog("Product ID from params", id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        debugLog("Fetching product with ID", id);
        setIsLoading(true);
        const res = await fetch(`/api/products/${id}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          debugLog("API Error Response", errorText);
          throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        debugLog("Product data received", data);
        
        const product = data.product;

        // Process gallery items
        const processedGallery = product.gallery.map((item: any) => ({
          ...item,
          additionalImages: Array.isArray(item.additionalImages)
            ? item.additionalImages.map((img: any) => ({
                id: img.id || `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                src: img.src,
                name: img.name
              }))
            : []
        }));

        // Format the product data for the form
        const formattedData = {
          ...product,
          gallery: processedGallery,
          regularPrice: String(product.regularPrice),
          tag: product.tag || "",
          sizes: product.sizes || [],
          occasions: product.occasions || [],
          style: product.style || [],
          season: product.season || [],
          fitType: product.fitType || "Regular Fit",
          sizingTrend: product.sizingTrend || 0,
          sizingNotes: product.sizingNotes || "",
          sizeChart: product.sizeChart || {},
          sizeChartImage: product.sizeChartImage || null
        };

        debugLog("Formatted data for form", formattedData);
        setInitialData(formattedData);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    } else {
      debugLog("No product ID found in params", null);
      setError("No product ID provided");
      setIsLoading(false);
    }
  }, [id]);

  debugLog("Component state", { isLoading, error, hasInitialData: !!initialData });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading product data...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <ProductForm
      isEditMode={true}
      initialData={initialData}
      productId={typeof id === 'string' ? id : Array.isArray(id) ? id[0] : String(id)}
      title="Edit Product"
      breadcrumbTitle="Edit Product"
    />
  );
}
