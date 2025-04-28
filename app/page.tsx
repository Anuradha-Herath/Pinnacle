"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCart } from './context/CartContext';
import Header from "./components/Header";
import ProductCarousel from "./components/ProductCarousel";
import Footer from "./components/Footer";
import Link from "next/link";
import HeaderPlaceholder from "./components/HeaderPlaceholder";
import OrderSuccess from './components/OrderSuccess';
import ClientOnly from './components/ClientOnly';

// Updated mock products with simplified images - all using existing images
const mockProducts = [
  {
    id: "1",
    name: "T-Shirt",
    price: 19.99,
    image: "/p1.webp",
    colors: ["/p1.webp", "/p1.webp", "/p1.webp"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "2",
    name: "Sneakers",
    price: 49.99,
    image: "/p2.webp",
    colors: ["/p2.webp", "/p2.webp", "/p2.webp"],
    sizes: ["6", "7", "8", "9", "10"],
  },
  {
    id: "3",
    name: "Jacket",
    price: 79.99,
    image: "/p3.webp",
    colors: ["/p3.webp", "/p3.webp", "/p3.webp"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "4",
    name: "Hat",
    price: 14.99,
    image: "/p4.webp",
    colors: ["/p4.webp", "/p4.webp", "/p4.webp"],
    sizes: ["One Size"],
  },
  {
    id: "5",
    name: "Jeans",
    price: 39.99,
    image: "/p5.webp",
    colors: ["/p5.webp", "/p5.webp"],
    sizes: ["28", "30", "32", "34", "36"],
  },
  {
    id: "6",
    name: "Watch",
    price: 59.99,
    image: "/p6.webp",
    colors: ["/p6.webp", "/p6.webp", "/p6.webp"],
    sizes: ["One Size"],
  },
  {
    id: "7",
    name: "Backpack",
    price: 34.99,
    image: "/p7.webp",
    colors: ["/p7.webp", "/p7.webp", "/p7.webp"],
    sizes: ["One Size"],
  },
  {
    id: "8",
    name: "Sunglasses",
    price: 29.99,
    image: "/p8.webp",
    colors: ["/p8.webp", "/p8.webp", "/p8.webp"],
    sizes: ["One Size"],
  },
  {
    id: "9",
    name: "Scarf",
    price: 19.99,
    image: "/p9.webp",
    colors: ["/p9.webp", "/p9.webp", "/p9.webp"],
    sizes: ["One Size"],
  },
];

const HomePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const hasProcessedParams = useRef(false);
  const orderProcessingComplete = useRef(false);

  const [products, setProducts] = useState(mockProducts);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderLoading, setGenderLoading] = useState(false);
  const [accessoriesLoading, setAccessoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('women');
  
  const categories = ["mens", "womens", "accessories"];
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({
    mens: [],
    womens: [],
    accessories: []
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        const productsByCategory: Record<string, any[]> = {
          mens: [],
          womens: [],
          accessories: []
        };
        data.products.forEach((product: any) => {
          const category = product.category?.toLowerCase() || "";
          if (category === "men" || category === "mens") {
            productsByCategory.mens.push(product);
          } else if (category === "women" || category === "womens") {
            productsByCategory.womens.push(product);
          } else {
            productsByCategory.accessories.push(product);
          }
        });
        setCategoryProducts(productsByCategory);
      }
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

  const fetchProductsByCategory = async (category: string) => {
    try {
      setGenderLoading(true);
      const apiCategory = category === 'men' ? 'Men' : 'Women';
      const response = await fetch(`/api/customer/products?category=${apiCategory}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${apiCategory} products`);
      }
      const data = await response.json();
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

  const fetchAccessoriesProducts = async () => {
    try {
      setAccessoriesLoading(true);
      const response = await fetch(`/api/customer/products?category=Accessories`);
      if (!response.ok) {
        throw new Error(`Failed to fetch accessories products: ${response.status}`);
      }
      const data = await response.json();
      setCategoryProducts(prev => ({
        ...prev,
        accessories: data.products || []
      }));
    } catch (err) {
      console.error(`Error fetching accessories products:`, err);
      setCategoryProducts(prev => ({
        ...prev,
        accessories: []
      }));
    } finally {
      setAccessoriesLoading(false);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await fetchProducts();
      await fetchAccessoriesProducts();
    };
    loadAllData();
  }, []);

  useEffect(() => {
    fetchProductsByCategory(selectedGender);
  }, [selectedGender]);

  const handleGenderToggle = (gender: 'men' | 'women') => {
    setSelectedGender(gender);
  };

  useEffect(() => {
    // Skip if we've already processed the success params
    if (hasProcessedParams.current) return;
    
    const success = searchParams.get('success');
    const order = searchParams.get('order');
    
    if (success === 'true' && !orderProcessingComplete.current) {
      console.log("Processing successful order:", order);
      orderProcessingComplete.current = true;
      hasProcessedParams.current = true;
      
      // Clear cart - make sure this runs successfully
      try {
        clearCart();
        console.log("Cart cleared successfully");
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
      
      // Set order number to display in success modal
      if (order) {
        setOrderNumber(order);
      }
      
      // Show success modal and toast
      setShowOrderSuccess(true);
      toast.success('Order placed successfully!');
      
      // Update URL to remove query params (after a short delay to ensure React state updates first)
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }
    
    const canceled = searchParams.get('canceled');
    if (canceled === 'true' && !hasProcessedParams.current) {
      hasProcessedParams.current = true;
      toast('Payment was canceled', { icon: '❌' });
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }
  }, [searchParams, clearCart]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      <HeaderPlaceholder />
      <ClientOnly>
        {showOrderSuccess && (
          <OrderSuccess 
            orderNumber={orderNumber} 
            onClose={() => {
              setShowOrderSuccess(false);
            }} 
          />
        )}
      </ClientOnly>
      <div className="banner max-h-[600px] overflow-hidden">
        <img src="/banner2.jpg" alt="Banner" className="w-full h-auto object-cover object-center" />
      </div>
      <div className="flex-grow">
        <div className="max-w-[1400px] mx-auto ">
          {/* Add custom white title */}
          <h2 className="text-2xl font-bold text-white px-4 md:px-8 pt-8 mb-6">Trending Products</h2>
          <ProductCarousel 
            title="" // Empty title since we're using a custom one above
            products={trendingProducts.length > 0 ? trendingProducts : products} 
            loading={loading}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 my-8 md:my-12 px-4 md:px-8 justify-center max-w-[1400px] mx-auto">
          <div className="relative w-full md:w-[45%] overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group">
            <div className="aspect-[4/3] w-full max-h-[300px]">
              <img
                src="/shopmen.webp"
                alt="Shop Men"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <ClientOnly>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-6 md:pb-8">
                <Link href="/category/Men" className="block">
                  <button className="bg-white text-black font-semibold py-2 px-6 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                    SHOP MEN
                  </button>
                </Link>
              </div>
            </ClientOnly>
          </div>
          <div className="relative w-full md:w-[45%] overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group mt-6 md:mt-0">
            <div className="aspect-[4/3] w-full max-h-[300px]">
              <img
                src="/shopwomen.webp"
                alt="Shop Women"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <ClientOnly>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-center pb-6 md:pb-8">
                <Link href="/category/Women" className="block">
                  <button className="bg-white text-black font-semibold py-2 px-6 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                    SHOP WOMEN
                  </button>
                </Link>
              </div>
            </ClientOnly>
          </div>
        </div>
        <div className="relative w-full my-8 md:my-12 px-4 md:px-8 lg:px-12 max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden rounded-xl shadow-xl transform transition-all duration-500 hover:shadow-2xl group">
            <div className="aspect-[16/5] w-full max-h-[250px]">
              <img
                src="/cap.jpg"
                alt="Accessories"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <ClientOnly>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end md:items-center justify-center md:justify-end pb-6 md:pb-0 md:pr-20">
                <Link href="/category/Accessories" className="block">
                  <button className="bg-white text-black font-semibold py-2 px-6 rounded-lg transform transition-all duration-300 hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-white">
                    SHOP ACCESSORIES
                  </button>
                </Link>
              </div>
            </ClientOnly>
          </div>
        </div>
        <div className="px-4 md:px-8 lg:px-12 my-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Best Sellers</h2>
            <ClientOnly>
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
            </ClientOnly>
          </div>
          <ProductCarousel
            title=""
            products={
              selectedGender === 'men'
                ? categoryProducts.mens.length > 0 ? categoryProducts.mens : []
                : categoryProducts.womens.length > 0 ? categoryProducts.womens : []
            }
            loading={genderLoading}
          />
          {!genderLoading && 
            ((selectedGender === 'men' && categoryProducts.mens.length === 0) || 
             (selectedGender === 'women' && categoryProducts.womens.length === 0)) && (
            <div className="text-center py-8 text-white">
              No products found for {selectedGender === 'men' ? 'men' : 'women'}.
            </div>
          )}
        </div>
        <div className="px-4 md:px-8 lg:px-12 my-8">
          <ProductCarousel
            title="Accessories"
            products={categoryProducts.accessories && categoryProducts.accessories.length > 0 
              ? categoryProducts.accessories 
              : []
            }
            loading={accessoriesLoading}
          />
          {!accessoriesLoading && 
            categoryProducts.accessories && 
            categoryProducts.accessories.length === 0 && (
            <div className="text-center py-8 text-white">
              No accessories products found.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
