"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import ProductForm from "@/app/components/product/ProductForm";
import { initialProductFormData } from "@/app/hooks/product/useProductForm";

export default function ProductEdit() {
  const { id } = useParams();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState(initialProductFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProduct = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        const res = await fetch(`/api/products/${id}`, {
          cache: 'force-cache',
          next: { revalidate: 60 }
        });
        
        if (!res.ok) throw new Error("Failed to fetch product");
        
        const data = await res.json();
        
        if (!isMounted) return;
        
        const product = data.product;

        // Process gallery with additional images
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

        // Format product data
        setProductData({
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
        });
        
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching product:", error);
          setError(error instanceof Error ? error.message : "An error occurred");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isClient && id) {
      fetchProduct();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id, isClient]);

  if (!isClient) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Edit" />
          <div className="p-6 flex items-center justify-center">
            <p>Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen relative">
        <Sidebar />
        <div className="flex flex-col flex-1 pb-20">
          <TopBar title="Product Edit" />
          <div className="p-6 text-red-500">
            Error loading product: {error}
          </div>
        </div>
      </div>
    );
  }

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
          
          <ProductForm 
            initialData={productData}
            isEdit={true}
            productId={Array.isArray(id) ? id[0] : id}
          />
        </div>
      </div>
    </div>
  );
}
