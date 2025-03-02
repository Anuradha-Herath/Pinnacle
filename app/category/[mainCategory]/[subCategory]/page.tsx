"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ProductCard from "@/app/components/ProductCard";

// Define types
interface Product {
  _id: string;
  productName: string;
  description: string;
  regularPrice: number;
  category: string; // Main category
  subCategory: string; // Subcategory
  gallery: Array<{src: string, color: string, name: string}>;
}

export default function SubCategoryPage() {
  const { mainCategory, subCategory } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch products matching both main category and subcategory
        const response = await fetch(`/api/products?category=${encodeURIComponent(mainCategory as string)}&subCategory=${encodeURIComponent(subCategory as string)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    if (mainCategory && subCategory) {
      fetchProducts();
    }
  }, [mainCategory, subCategory]);
  
  // Format products for ProductCard component
  const formattedProducts = products.map(product => ({
    id: product._id,
    name: product.productName,
    price: product.regularPrice,
    image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : "/placeholder.png",
    colors: product.gallery?.map(item => item.color) || [],
    sizes: [], // Assuming sizes are not directly on the product
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{subCategory}</h1>
          <p className="text-gray-500">
            <span className="cursor-pointer hover:text-orange-500" onClick={() => window.history.back()}>
              {mainCategory}
            </span> / {subCategory}
          </p>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}
        
        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* No Products State */}
        {!loading && !error && formattedProducts.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium mb-4">No products found</h2>
            <p className="text-gray-500">We couldn't find any products in this subcategory.</p>
          </div>
        )}
        
        {/* Products Grid */}
        {!loading && !error && formattedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {formattedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
