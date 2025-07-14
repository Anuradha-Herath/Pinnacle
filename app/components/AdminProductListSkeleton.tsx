"use client";

import React from 'react';

const AdminProductListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(9)].map((_, index) => (
        <div key={index} className="bg-white shadow-lg rounded-2xl p-4 relative animate-pulse">
          {/* Action Buttons Skeleton */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-300 w-8 h-8 rounded-full"></div>
            ))}
          </div>

          {/* Product Image Skeleton */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-300 w-[150px] h-[150px] rounded-md"></div>
          </div>

          {/* Product Name Skeleton */}
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          
          {/* Price Skeleton */}
          <div className="h-5 bg-gray-300 rounded w-20 mb-4"></div>

          {/* Sales & Remaining Products Skeleton */}
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex justify-between mb-3">
              <div className="h-3 bg-gray-300 rounded w-12"></div>
              <div className="h-3 bg-gray-300 rounded w-8"></div>
            </div>

            <div className="flex justify-between mb-1">
              <div className="h-3 bg-gray-300 rounded w-20"></div>
              <div className="h-3 bg-gray-300 rounded w-6"></div>
            </div>
            
            {/* Progress Bar Skeleton */}
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminProductListSkeleton;
