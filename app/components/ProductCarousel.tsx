"use client";

import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  colors: string[];
  sizes: string[];
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  loading?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ 
  title, 
  products,
  loading = false 
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { current: container } = carouselRef;
      const scrollAmount = direction === "left" ? -600 : 600;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });

      // Update arrow visibility after scrolling
      setTimeout(() => {
        if (container) {
          setShowLeftArrow(container.scrollLeft > 0);
          setShowRightArrow(
            container.scrollLeft + container.clientWidth < container.scrollWidth
          );
        }
      }, 300);
    }
  };

  return (
    <div className="my-8 px-4 md:px-8 lg:px-12">
      <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Products Container */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto gap-4 pb-4 no-scrollbar"
          onScroll={() => {
            if (carouselRef.current) {
              const { current: container } = carouselRef;
              setShowLeftArrow(container.scrollLeft > 0);
              setShowRightArrow(
                container.scrollLeft + container.clientWidth <
                  container.scrollWidth
              );
            }
          }}
        >
          {loading ? (
            // Loading skeleton placeholders
            Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="w-[300px] min-w-[300px] bg-gray-700 shadow-md rounded-lg p-4 animate-pulse">
                <div className="w-full h-60 bg-gray-600 rounded-md"></div>
                <div className="h-5 bg-gray-600 rounded w-3/4 mt-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/4 mt-2"></div>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 bg-gray-600 rounded-md"></div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 bg-gray-600 rounded"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-600 rounded w-full mt-3"></div>
              </div>
            ))
          ) : products.length > 0 ? (
            // Actual products
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // No products message
            <div className="w-full py-10 flex justify-center items-center text-white">
              <p>No products available for this category.</p>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCarousel;
