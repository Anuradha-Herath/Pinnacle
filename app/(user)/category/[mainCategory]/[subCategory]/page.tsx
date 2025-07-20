"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Filter } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ProductCard from "@/app/components/ProductCard";
import FilterSidebar, { FilterOptions } from "@/app/components/FilterSidebar";
import { fetchProducts } from "@/lib/apiUtils";

// Define types
interface Product {
  _id: string;
  productName: string;
  description: string;
  regularPrice: number;
  category: string;
  subCategory: string;
  gallery: Array<{src: string, color: string, name: string}>;
  sizes: string[];
  createdAt?: string;
}

export default function SubCategoryPage() {
  const { mainCategory: encodedMainCategory, subCategory: encodedSubCategory } = useParams();
  const mainCategory = typeof encodedMainCategory === 'string' ? decodeURIComponent(encodedMainCategory) : '';
  const subCategory = typeof encodedSubCategory === 'string' ? decodeURIComponent(encodedSubCategory) : '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load separately
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    priceRange: [0, 5000],
    sizes: [],
    sortBy: "newest",
    onSale: false,
  });
  
  // Fetch products
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching products for ${mainCategory}/${subCategory}`);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout - Please try again')), 10000)
        );
        
        // Use the new API utility with deduplication and timeout
        const dataPromise = fetchProducts({
          category: mainCategory, // Use decoded values for API
          subCategory: subCategory,
          _t: Date.now(), // Add cache buster for fresh data
        }) as Promise<{ products: Product[] }>;
        
        const data = await Promise.race([dataPromise, timeoutPromise]) as { products: Product[] };
        
        const fetchedProducts = data.products || [];
        
        console.log(`Fetched ${fetchedProducts.length} products for ${mainCategory}/${subCategory}`);
        setProducts(fetchedProducts);
        
        // Extract available sizes and price range from products
        const allSizes = new Set<string>();
        let minPrice = Number.MAX_VALUE;
        let maxPrice = 0;
        
        fetchedProducts.forEach((product: Product) => {
          if (product.sizes && Array.isArray(product.sizes)) {
            product.sizes.forEach(size => allSizes.add(size));
          }
          
          if (product.regularPrice < minPrice) minPrice = product.regularPrice;
          if (product.regularPrice > maxPrice) maxPrice = product.regularPrice;
        });
        
        console.log(`Extracted ${allSizes.size} unique sizes:`, Array.from(allSizes));
        setAvailableSizes(Array.from(allSizes));
        setPriceRange({ 
          min: minPrice !== Number.MAX_VALUE ? minPrice : 0,
          max: maxPrice !== 0 ? maxPrice : 5000 
        });
        
        // Initialize with default price range
        setActiveFilters(prev => ({
          ...prev,
          priceRange: [minPrice !== Number.MAX_VALUE ? minPrice : 0, maxPrice !== 0 ? maxPrice : 5000]
        }));
        
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load products');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    if (encodedMainCategory && encodedSubCategory) {
      fetchProductsData();
    }
  }, [encodedMainCategory, encodedSubCategory, mainCategory, subCategory]);
  
  // Apply filters when products or filters change
  useEffect(() => {
    if (products.length === 0) return;
    
    let result = [...products];
    
    // Filter by price range
    result = result.filter(product => 
      product.regularPrice >= activeFilters.priceRange[0] && 
      product.regularPrice <= activeFilters.priceRange[1]
    );
    
    // Filter by sizes (if any selected)
    if (activeFilters.sizes.length > 0) {
      result = result.filter(product => 
        activeFilters.sizes.some(size => product.sizes?.includes(size))
      );
    }
    
    // Sort products
    switch (activeFilters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.regularPrice - b.regularPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.regularPrice - a.regularPrice);
        break;
      case "newest":
        result.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      // Add more sorting options as needed
    }
    
    setFilteredProducts(result);
    
  }, [products, activeFilters]);
  
  // Format products for ProductCard component
  const formattedProducts = filteredProducts.map(product => {
    // Extract unique colors from gallery
    const colors = product.gallery?.reduce((colorSet, item) => {
      if (item.src && item.src.trim() !== '') {
        colorSet.add(item.src);
      }
      return colorSet;
    }, new Set<string>());
    
    return {
      id: product._id,
      name: product.productName,
      price: product.regularPrice,
      image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : "/placeholder.png",
      colors: Array.from(colors || []),
      sizes: product.sizes || [],
      category: product.category,
      subCategory: product.subCategory,
    };
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setActiveFilters(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{subCategory}</h1>
          <p className="text-gray-500">
            <span className="cursor-pointer hover:text-gray-700" onClick={() => window.history.back()}>
              {mainCategory}
            </span> / {subCategory}
          </p>
        </div>
        
        {/* Mobile Filter Toggle Button */}
        <button 
          className="md:hidden flex items-center justify-center w-full py-2 bg-gray-900 text-white rounded-md mb-4"
          onClick={() => setShowMobileFilters(true)}
        >
          <Filter size={18} className="mr-2" />
          Filter & Sort
        </button>
        
        {/* Mobile Filter Sidebar - Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex md:hidden">
            <div className="w-80 bg-white h-full ml-auto overflow-auto z-50 animate-slide-in-right">
              <FilterSidebar 
                onFilterChange={handleFilterChange}
                initialFilters={activeFilters}
                availableSizes={availableSizes}
                priceRange={priceRange}
                isMobile={true}
                onMobileClose={() => setShowMobileFilters(false)}
              />
            </div>
          </div>
        )}
        
        {/* Content Area - Desktop Layout with Sidebar */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <FilterSidebar 
                onFilterChange={handleFilterChange}
                initialFilters={activeFilters}
                availableSizes={availableSizes}
                priceRange={priceRange}
              />
            </div>
          </div>
          
          {/* Product Grid */}
          <div className="flex-1">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                <p className="mt-4 text-gray-600">
                  {initialLoad ? `Loading ${mainCategory} > ${subCategory} products...` : 'Updating filters...'}
                </p>
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
                <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            )}
            
            {/* Products Grid */}
            {!loading && !error && formattedProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {formattedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
