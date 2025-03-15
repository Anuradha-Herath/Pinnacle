// pages/single-product-static.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductInformation from "../components/ProductInformation";
import ProductDetailsSection from "../components/ProductDetailsSection";
import UserReviewsSection from "../components/UserReviewsSection";
import ProductCarousel from "../components/ProductCarousel";
import ProductCard from "../components/ProductCard";
import ProductImageGallery from "../components/ProductImageGallery"; // **Import is already here - keep it**

// Use direct string paths instead:
const p1 = "/p1.webp";
const p2 = "/p2.webp";
const p3 = "/p3.webp";
const p4 = "/p4.webp";
const p5 = "/p5.webp";

const SingleProductStaticPage = () => {
  const router = useRouter();
  const [product] = useState({
    id: 1,
    name: "Black T-Shirt",
    price: 25.99,
    image: p1, // We won't directly use this 'image' anymore for the main image display
    description:
      "A stylish and comfortable black t-shirt made from 100% cotton.",
    details: [
      "100% Cotton",
      "Machine washable",
      "Unisex fit",
      "Available in multiple colors",
    ],
    rating: 4.5,
    colors: ["Black", "White", "Gray", "Blue"],
    sizes: ["S", "M", "L", "XL"],
  });
  const [reviews] = useState([
    { id: 1, name: "John Doe", rating: 5, comment: "Great quality and fit!" },
    {
      id: 2,
      name: "Jane Smith",
      rating: 4,
      comment: "Nice design, but the fabric is a bit thin.",
    },
  ]);

  // Dummy products for carousels
  const dummyProducts = [
    {
      id: 1,
      name: "Product 1",
      price: 19.99,
      image: p2,
      colors: [],
      sizes: [],
    },
    {
      id: 2,
      name: "Product 2",
      price: 29.99,
      image: p3,
      colors: [],
      sizes: [],
    },
    {
      id: 3,
      name: "Product 3",
      price: 39.99,
      image: p4,
      colors: [],
      sizes: [],
    },
    {
      id: 4,
      name: "Product 4",
      price: 49.99,
      image: p5,
      colors: [],
      sizes: [],
    },
    {
      id: 5,
      name: "Product 5",
      price: 59.99,
      image: p1,
      colors: [],
      sizes: [],
    },
    // ... add more dummy products as needed
  ];

  // **Define the productImages array for ProductImageGallery**
  const productImages = [
    p1, // Image 1 path
    p2, // Image 2 path
    p3, // Image 3 path
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* **Replace <img> tag with ProductImageGallery component** */}
          <ProductImageGallery images={productImages} />
          <ProductInformation product={product} />
        </div>
        <ProductDetailsSection details={product.details} />
        <UserReviewsSection reviews={reviews} />
        <button
          onClick={() => router.push("/shop")}
          className="mt-6 text-gray-600 underline"
        >
          Back to Shop
        </button>
      </div>

      <ProductCarousel title="YOU MIGHT ALSO LIKE" products={dummyProducts} />
      <ProductCarousel
        title="RECENTLY VIEWED"
        products={dummyProducts.slice(2)}
      />

      <Footer />
    </div>
  );
};

export default SingleProductStaticPage;
