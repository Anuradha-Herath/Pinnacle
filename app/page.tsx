"use client";

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ProductCarousel from "./components/ProductCarousel";
import Footer from "./components/Footer";
import Link from "next/link";
import HeaderPlaceholder from "./components/HeaderPlaceholder";
import { API_ENDPOINTS, CATEGORIES, IMAGES, UI_TEXT } from "@/lib/constants";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderLoading, setGenderLoading] = useState(false);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('women');
  
  // Categories we want to display - use lowercase consistently
  const categories = [
    CATEGORIES.MEN.stateKey, 
    CATEGORIES.WOMEN.stateKey, 
    CATEGORIES.ACCESSORIES.id
  ];
  
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({
    [CATEGORIES.MEN.stateKey]: [],
    [CATEGORIES.WOMEN.stateKey]: [],
    [CATEGORIES.ACCESSORIES.id]: []
  });

  // Function to fetch all products and categorize them
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch all products
      const response = await fetch(API_ENDPOINTS.PRODUCTS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        
        // Organize products by category - use lowercase consistently
        const productsByCategory: Record<string, any[]> = {
          [CATEGORIES.MEN.stateKey]: [],
          [CATEGORIES.WOMEN.stateKey]: [],
          [CATEGORIES.ACCESSORIES.id]: []
        };
        
        data.products.forEach((product: any) => {
          const category = product.category?.toLowerCase() || "";
          console.log(`Product: ${product.name}, Category: ${category}`);
          
          // Match category to our predefined categories
          if (category === CATEGORIES.MEN.id || category === CATEGORIES.MEN.stateKey) {
            productsByCategory[CATEGORIES.MEN.stateKey].push(product);
          } else if (category === CATEGORIES.WOMEN.id || category === CATEGORIES.WOMEN.stateKey) {
            productsByCategory[CATEGORIES.WOMEN.stateKey].push(product);
          } else {
            productsByCategory[CATEGORIES.ACCESSORIES.id].push(product);
          }
        });
        
        console.log("Categorized products:", {
          menProducts: productsByCategory[CATEGORIES.MEN.stateKey].length,
          womenProducts: productsByCategory[CATEGORIES.WOMEN.stateKey].length,
          accessoriesProducts: productsByCategory[CATEGORIES.ACCESSORIES.id].length
        });
        
        setCategoryProducts(productsByCategory);
      }
      
      // Fetch trending products (newly created + recently stocked)
      const trendingResponse = await fetch(API_ENDPOINTS.TRENDING);
      
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingProducts(trendingData.products || []);
      }
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products by specific category when gender toggle changes
  const fetchProductsByCategory = async (category: string) => {
    try {
      setGenderLoading(true);
      
      // Convert 'men'/'women' to match API parameter ('Men'/'Women')
      const apiCategory = category === CATEGORIES.MEN.id 
        ? CATEGORIES.MEN.apiName 
        : CATEGORIES.WOMEN.apiName;
      
      // Fetch products filtered by category
      const response = await fetch(API_ENDPOINTS.CATEGORY(apiCategory));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${apiCategory} products`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${apiCategory} products:`, data.products?.length || 0);
      
      // Update just the specific category in our state
      if (data.products) {
        setCategoryProducts(prev => ({
          ...prev,
          [category + 's']: data.products
        }));
      }
      
    } catch (err) {
      console.error(`Error fetching ${category} products:`, err);
    } finally {
      setGenderLoading(false);
    }
  };

  // Improved fetchAccessoriesProducts with better error handling
  const fetchAccessoriesProducts = async () => {
    try {
      setAccessoriesLoading(true);
      
      // Ensure consistent casing by using "Accessories" exactly
      console.log('Fetching accessories products...');
      
      const response = await fetch(API_ENDPOINTS.CATEGORY(CATEGORIES.ACCESSORIES.apiName));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accessories products: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.products?.length || 0} accessories products`);
      
      // Debug the categories to make sure matching is working
      if (data.products?.length > 0) {
        console.log('Accessories product categories:', 
          data.products.map((p: any) => p.category));
      } else {
        console.log('No accessories products found in the API response');
      }
      
      // Update state only if we have products or an empty array
      setCategoryProducts(prev => ({
        ...prev,
        [CATEGORIES.ACCESSORIES.id]: data.products || []
      }));
      
    } catch (err) {
      console.error(`Error fetching accessories products:`, err);
      // On error, ensure we don't leave the carousel in a loading state
      setCategoryProducts(prev => ({
        ...prev,
        [CATEGORIES.ACCESSORIES.id]: [] // Reset to empty array on error
      }));
    } finally {
      setAccessoriesLoading(false);
    }
  };

  // Initial product fetch
  useEffect(() => {
    const loadAllData = async () => {
      // First fetch all products
      await fetchProducts();
      // Then fetch accessories specifically to ensure consistency
      await fetchAccessoriesProducts();
    };
    
    loadAllData();
  }, []);

  // Fetch products when gender toggle changes
  useEffect(() => {
    fetchProductsByCategory(selectedGender);
  }, [selectedGender]);

  // Handle gender toggle with debug info
  const handleGenderToggle = (gender: 'men' | 'women') => {
    console.log(`Switching to ${gender} products`);
    setSelectedGender(gender);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      <HeaderPlaceholder />
      
      {/* Banner */}
      <div className="banner">
        <img src={IMAGES.BANNER} alt="Banner" className="w-full h-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Trending Products - Newly Created + Recently Stocked */}
        <ProductCarousel 
          title={UI_TEXT.TRENDING_TITLE} 
          products={trendingProducts.length > 0 ? trendingProducts : products} 
          loading={loading}
        />

        {/* Large Shop Now Images */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 my-12 md:my-16 px-4 md:px-8 justify-center">
          {/* Shop Men */}
          <div className="relative w-full md:w-[45%] overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group">
            <div className="aspect-[4/3] w-full">
              <img
                src={IMAGES.MEN}
                alt="Shop Men"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-10 md:pb-12">
              <Link href={`/category/${CATEGORIES.MEN.apiName}`} className="block">
                <button className="bg-white text-black font-semibold py-3 px-8 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                  {UI_TEXT.SHOP_MEN}
                </button>
              </Link>
            </div>
          </div>

          {/* Shop Women */}
          <div className="relative w-full md:w-[45%] overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group mt-6 md:mt-0">
            <div className="aspect-[4/3] w-full">
              <img
                src={IMAGES.WOMEN}
                alt="Shop Women"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-10 md:pb-12">
              <Link href={`/category/${CATEGORIES.WOMEN.apiName}`} className="block">
                <button className="bg-white text-black font-semibold py-3 px-8 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                  {UI_TEXT.SHOP_WOMEN}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Large Accessories Banner */}
        <div className="relative w-full my-12 md:my-16 px-4 md:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group">
            <div className="aspect-[16/5] w-full">
              <img
                src={IMAGES.ACCESSORIES}
                alt="Accessories"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end md:items-center justify-center md:justify-end pb-10 md:pb-0 md:pr-20">
              <Link href={`/category/${CATEGORIES.ACCESSORIES.apiName}`} className="block">
                <button className="bg-white text-black font-semibold py-3 px-8 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                  {UI_TEXT.SHOP_ACCESSORIES}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Best Sellers with Gender Toggle */}
        <div className="px-4 md:px-8 lg:px-12 my-8">
          {/* Title with Toggle Buttons */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">{UI_TEXT.BEST_SELLERS}</h2>
            <div className="bg-gray-200 rounded-full p-1 inline-flex">
              <button 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === CATEGORIES.MEN.id 
                    ? 'bg-[black] text-white' 
                    : 'text-black hover:bg-gray-300'
                }`}
                onClick={() => handleGenderToggle(CATEGORIES.MEN.id as 'men')}
              >
                {CATEGORIES.MEN.name.toUpperCase()}
              </button>
              <button 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === CATEGORIES.WOMEN.id 
                    ? 'bg-[black] text-white' 
                    : 'text-black hover:bg-gray-300'
                }`}
                onClick={() => handleGenderToggle(CATEGORIES.WOMEN.id as 'women')}
              >
                {CATEGORIES.WOMEN.name.toUpperCase()}
              </button>
            </div>
          </div>
          
          {/* Products Carousel without title (using empty string) */}
          <ProductCarousel
            title=""
            products={
              selectedGender === CATEGORIES.MEN.id
                ? categoryProducts[CATEGORIES.MEN.stateKey].length > 0 ? categoryProducts[CATEGORIES.MEN.stateKey] : []
                : categoryProducts[CATEGORIES.WOMEN.stateKey].length > 0 ? categoryProducts[CATEGORIES.WOMEN.stateKey] : []
            }
            loading={genderLoading}
          />
          
          {/* Show message if no products in category */}
          {!genderLoading && 
            ((selectedGender === CATEGORIES.MEN.id && categoryProducts[CATEGORIES.MEN.stateKey].length === 0) || 
             (selectedGender === CATEGORIES.WOMEN.id && categoryProducts[CATEGORIES.WOMEN.stateKey].length === 0)) && (
            <div className="text-center py-8 text-black">
              {UI_TEXT.NO_PRODUCTS_FOR_GENDER(selectedGender === CATEGORIES.MEN.id ? CATEGORIES.MEN.name.toLowerCase() : CATEGORIES.WOMEN.name.toLowerCase())}
            </div>
          )}
        </div>

        {/* Accessories - Updated to match the loading style of other carousels */}
        <div className="px-4 md:px-8 lg:px-12 my-8">
          <ProductCarousel
            title={CATEGORIES.ACCESSORIES.name}
            products={categoryProducts[CATEGORIES.ACCESSORIES.id] && categoryProducts[CATEGORIES.ACCESSORIES.id].length > 0 
              ? categoryProducts[CATEGORIES.ACCESSORIES.id] 
              : []
            }
            loading={accessoriesLoading}
          />
          
          {/* Show message if no accessories products and not loading */}
          {!accessoriesLoading && 
            categoryProducts[CATEGORIES.ACCESSORIES.id] && 
            categoryProducts[CATEGORIES.ACCESSORIES.id].length === 0 && (
            <div className="text-center py-8 text-black">
              {UI_TEXT.NO_ACCESSORIES_FOUND}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
