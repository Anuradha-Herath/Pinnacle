"use client";

import React from "react";

// Optimized skeleton with reduced animations and simplified structure for faster rendering
const ProductCardSkeleton = ({ simplified = false }: { simplified?: boolean }) => {
  return (
    <div className="w-[360px] min-w-[360px] bg-white shadow-md rounded-lg p-5 relative">
      {/* Image placeholder - using opacity for better performance than animate-pulse */}
      <div className="w-full h-80 bg-gray-200 rounded-md opacity-70"></div>
      
      {/* Title placeholder */}
      <div className="mt-2 h-6 bg-gray-200 rounded-md w-3/4"></div>
      
      {/* Price placeholder */}
      <div className="mt-2 h-5 bg-gray-200 rounded-md w-1/3"></div>
      
      {/* Skip colors and sizes in simplified mode for trending carousel for faster render */}
      {!simplified && (
        <>
          {/* Colors placeholder */}
          <div className="flex gap-2 mt-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-md bg-gray-200"></div>
            ))}
          </div>
          
          {/* Sizes placeholder */}
          <div className="flex gap-2 mt-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-md bg-gray-200"></div>
            ))}
          </div>
        </>
      )}
      
      {/* Button placeholder */}
      <div className="mt-4 h-10 bg-gray-200 rounded-full w-3/4"></div>
    </div>
  );
};

export default ProductCardSkeleton;
