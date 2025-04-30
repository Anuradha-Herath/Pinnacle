"use client";

import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="w-[360px] min-w-[360px] bg-white shadow-md rounded-lg p-5 relative">
      {/* Image placeholder */}
      <div className="w-full h-80 bg-gray-200 rounded-md animate-pulse"></div>
      
      {/* Title placeholder */}
      <div className="mt-2 h-6 bg-gray-200 rounded-md w-3/4 animate-pulse"></div>
      
      {/* Price placeholder */}
      <div className="mt-2 h-5 bg-gray-200 rounded-md w-1/3 animate-pulse"></div>
      
      {/* Colors placeholder */}
      <div className="flex gap-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-10 h-10 rounded-md bg-gray-200 animate-pulse"></div>
        ))}
      </div>
      
      {/* Sizes placeholder */}
      <div className="flex gap-2 mt-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-md bg-gray-200 animate-pulse"></div>
        ))}
      </div>
      
      {/* Button placeholder */}
      <div className="mt-4 h-10 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
    </div>
  );
};

export default ProductCardSkeleton;
