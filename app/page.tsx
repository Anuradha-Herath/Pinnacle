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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Categories we want to display
  const categories = ["Mens", "Womens", "Accessories"];
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({
    Mens: [],
    Womens: [],
    Accessories: []
  });

  useEffect(() => {
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
          
          // Organize products by category
          const productsByCategory: Record<string, any[]> = {
            Mens: [],
            Womens: [],
            Accessories: []
          };
          
          data.products.forEach((product: any) => {
            // Match category to our predefined categories
            if (product.category?.toLowerCase() === "mens") {
              productsByCategory.Mens.push(product);
            } else if (product.category?.toLowerCase() === "womens") {
              productsByCategory.Womens.push(product);
            } else {
              productsByCategory.Accessories.push(product);
            }
          });
          
          setCategoryProducts(productsByCategory);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Header />
      {/* Banner */}
      <div className="banner">
        <img src="/banner2.jpg" alt="Banner" className="w-full h-auto" />
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {/* Men's Collection */}
        <ProductCarousel 
          title="Men's Collection" 
          products={categoryProducts.Mens.length > 0 ? categoryProducts.Mens : products} 
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

        {/* Women's Collection */}
        <ProductCarousel 
          title="Women's Collection" 
          products={categoryProducts.Womens.length > 0 ? categoryProducts.Womens : products}
        />

        {/* Accessories */}
        <ProductCarousel 
          title="Accessories" 
          products={categoryProducts.Accessories.length > 0 ? categoryProducts.Accessories : products}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
