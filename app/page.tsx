"use client";

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ProductCarousel from "./components/ProductCarousel";
import Footer from "./components/Footer";

// Updated mock products with simplified images - all using existing images
const mockProducts = [
  {
    id: "1",
    name: "T-Shirt",
    price: 19.99,
    image: "/p1.webp",
    colors: ["/p1.webp", "/p1.webp", "/p1.webp"], // All using the same image
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "2",
    name: "Sneakers",
    price: 49.99,
    image: "/p2.webp",
    colors: ["/p2.webp", "/p2.webp", "/p2.webp"], // All using the same image
    sizes: ["6", "7", "8", "9", "10"],
  },
  {
    id: "3",
    name: "Jacket",
    price: 79.99,
    image: "/p3.webp",
    colors: ["/p3.webp", "/p3.webp", "/p3.webp"], // All using the same image
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "4",
    name: "Hat",
    price: 14.99,
    image: "/p4.webp",
    colors: ["/p4.webp", "/p4.webp", "/p4.webp"], // All using the same image
    sizes: ["One Size"],
  },
  {
    id: "5",
    name: "Jeans",
    price: 39.99,
    image: "/p5.webp",
    colors: ["/p5.webp", "/p5.webp"], // All using the same image
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    id: "6",
    name: "Watch",
    price: 59.99,
    image: "/p6.webp",
    colors: ["/p6.webp", "/p6.webp", "/p6.webp"], // All using the same image
    sizes: ["One Size"],
  },
  {
    id: "7",
    name: "Backpack",
    price: 34.99,
    image: "/p7.webp",
    colors: ["/p7.webp", "/p7.webp", "/p7.webp"], // All using the same image
    sizes: ["One Size"],
  },
  {
    id: "8",
    name: "Sunglasses",
    price: 29.99,
    image: "/p8.webp",
    colors: ["/p8.webp", "/p8.webp", "/p8.webp"], // All using the same image
    sizes: ["One Size"],
  },
  {
    id: "9",
    name: "Scarf",
    price: 19.99,
    image: "/p9.webp",
    colors: ["/p9.webp", "/p9.webp", "/p9.webp"], // All using the same image
    sizes: ["One Size"],
  },
];

const HomePage = () => {
  const [products, setProducts] = useState(mockProducts);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderLoading, setGenderLoading] = useState(false);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('women');
  
  // Categories we want to display - use lowercase consistently
  const categories = ["mens", "womens", "accessories"];
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({
    mens: [],
    womens: [],
    accessories: []
  });

  // Function to fetch all products and categorize them
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch all products
      const response = await fetch('/api/customer/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        
        // Organize products by category - use lowercase consistently
        const productsByCategory: Record<string, any[]> = {
          mens: [],
          womens: [],
          accessories: []
        };
        
        data.products.forEach((product: any) => {
          const category = product.category?.toLowerCase() || "";
          console.log(`Product: ${product.name}, Category: ${category}`);
          
          // Match category to our predefined categories
          if (category === "men" || category === "mens") {
            productsByCategory.mens.push(product);
          } else if (category === "women" || category === "womens") {
            productsByCategory.womens.push(product);
          } else {
            productsByCategory.accessories.push(product);
          }
        });
        
        console.log("Categorized products:", {
          menProducts: productsByCategory.mens.length,
          womenProducts: productsByCategory.womens.length,
          accessoriesProducts: productsByCategory.accessories.length
        });
        
        setCategoryProducts(productsByCategory);
      }
      
      // Fetch trending products (newly created + recently stocked)
      const trendingResponse = await fetch('/api/customer/trending');
      
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
      const apiCategory = category === 'men' ? 'Men' : 'Women';
      
      // Fetch products filtered by category
      const response = await fetch(`/api/customer/products?category=${apiCategory}`);
      
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

  // New function to specifically fetch accessories products
  const fetchAccessoriesProducts = async () => {
    try {
      setAccessoriesLoading(true);
      
      // Log the request we're making for debugging
      console.log('Fetching accessories products...');
      
      // Fetch products filtered by Accessories category
      const response = await fetch(`/api/customer/products?category=Accessories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accessories products`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.products?.length || 0} accessories products`);
      
      // Debug: Log the categories of fetched products
      if (data.products?.length > 0) {
        console.log('Accessories product categories:', 
          data.products.map((p: any) => p.category));
      }
      
      // Update just the accessories category in our state
      if (data.products) {
        setCategoryProducts(prev => ({
          ...prev,
          accessories: data.products
        }));
      }
      
    } catch (err) {
      console.error(`Error fetching accessories products:`, err);
    } finally {
      setAccessoriesLoading(false);
    }
  };

  // Initial product fetch
  useEffect(() => {
    fetchProducts();
    fetchAccessoriesProducts(); // Fetch accessories products specifically
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
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      {/* Banner */}
      <div className="banner">
        <img src="/banner2.jpg" alt="Banner" className="w-full h-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Trending Products - Newly Created + Recently Stocked */}
        <ProductCarousel 
          title="Trending Products" 
          products={trendingProducts.length > 0 ? trendingProducts : products} 
          loading={loading}
        />

        {/* Large Shop Now Images */}
        <div className="flex gap-4 my-10 px-4 justify-center">
          {/* Shop Men */}
          <div className="relative w-[45%]">
            <img
              src="/shopmen.webp"
              alt="Shop Men"
              className="w-full h-[300px] object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
                Shop Men
              </button>
            </div>
          </div>

          {/* Shop Women */}
          <div className="relative w-[45%]">
            <img
              src="/shopwomen.webp"
              alt="Shop Women"
              className="w-full h-[300px] object-cover rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
                Shop Women
              </button>
            </div>
          </div>
        </div>

        {/* Large Accessories Banner */}
        <div className="relative w-full my-10 px-4 md:px-8 lg:px-12">
          <img
            src="/cap.jpg"
            alt="Accessories"
            className="w-full h-[250px] object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <button className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200">
              Shop Accessories
            </button>
          </div>
        </div>

        {/* Best Sellers with Gender Toggle */}
        <div className="px-4 md:px-8 lg:px-12 my-8">
          {/* Title with Toggle Buttons */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Best Sellers</h2>
            <div className="bg-gray-800 rounded-full p-1 inline-flex">
              <button 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === 'men' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-white hover:bg-gray-700'
                }`}
                onClick={() => handleGenderToggle('men')}
              >
                MEN
              </button>
              <button 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGender === 'women' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-white hover:bg-gray-700'
                }`}
                onClick={() => handleGenderToggle('women')}
              >
                WOMEN
              </button>
            </div>
          </div>
          
          {/* Products Carousel without title (using empty string) */}
          <ProductCarousel
            title=""
            products={
              selectedGender === 'men'
                ? categoryProducts.mens.length > 0 ? categoryProducts.mens : []
                : categoryProducts.womens.length > 0 ? categoryProducts.womens : []
            }
            loading={genderLoading}
          />
          
          {/* Show message if no products in category */}
          {!genderLoading && 
            ((selectedGender === 'men' && categoryProducts.mens.length === 0) || 
             (selectedGender === 'women' && categoryProducts.womens.length === 0)) && (
            <div className="text-center py-8 text-white">
              No products found for {selectedGender === 'men' ? 'men' : 'women'}.
            </div>
          )}
        </div>

        {/* Accessories - Updated to match the loading style of other carousels */}
        <div className="px-4 md:px-8 lg:px-12 my-8">
          <ProductCarousel
            title="Accessories"
            products={categoryProducts.accessories && categoryProducts.accessories.length > 0 
              ? categoryProducts.accessories 
              : []
            }
            loading={accessoriesLoading}
          />
          
          {/* Show message if no accessories products and not loading */}
          {!accessoriesLoading && 
            categoryProducts.accessories && 
            categoryProducts.accessories.length === 0 && (
            <div className="text-center py-8 text-white">
              No accessories products found.
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
