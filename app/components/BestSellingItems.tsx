"use client";

import React from "react";
import { BestSellingProduct } from "@/app/api/dashboard/route";
import Image from "next/image";
import { FaTrophy, FaMedal, FaAward, FaChartLine } from "react-icons/fa";

interface BestSellingItemsProps {
  products?: BestSellingProduct[];
}

const BestSellingItems: React.FC<BestSellingItemsProps> = ({ products = [] }) => {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get ranking icon based on position
  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0:
        return <FaTrophy className="text-yellow-500" title="Top Seller" />;
      case 1:
        return <FaMedal className="text-gray-400" title="2nd Place" />;
      case 2:
        return <FaAward className="text-amber-700" title="3rd Place" />;
      default:
        return <FaChartLine className="text-blue-500" title="Trending" />;
    }
  };

  // Calculate highest sales count for percentage
  const maxSalesCount = products && products.length > 0
    ? Math.max(...products.map(p => p.salesCount))
    : 0;
    
  // Debug: Log product names to console
  React.useEffect(() => {
    if (products && products.length > 0) {
      console.log("Original product names:", products.map(p => p.name));
    }
  }, [products]);

  // If no products are provided, use placeholder data
  const displayProducts = products && products.length > 0 
    ? products.slice(0, 3).map(product => ({
        ...product,
        // More aggressive cleaning of product name to remove size/color info
        name: product.name && product.name !== "undefined" 
          ? product.name
              .replace(/\s*[-–—]\s*(Size|Color|Colour):[^,]+/gi, '')
              .replace(/\s*[-–—]\s*(S|M|L|XL|XXL|Black|White|Red|Blue|Green|Yellow|Pink|Purple|Gray|Grey|Brown)\b/gi, '')
              .replace(/\s+,\s+/g, ', ')
              .replace(/\s{2,}/g, ' ')
              .trim()
          : `Product ID: ${product.productId.substring(0, 8)}...`
      }))
    : [
        {
          productId: "1",
          name: "Loading products...",
          price: 0,
          salesCount: 0
        }
      ];

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Top 3 Trending Products</h3>
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">By Order Count</span>
      </div>
      
      <div className="space-y-5 flex-grow">
        {displayProducts.map((product, index) => {
          // Calculate width percentage for sales visualization
          const percentWidth = maxSalesCount > 0
            ? (product.salesCount / maxSalesCount) * 100
            : 0;
            
          return (
            <div key={product.productId} className="relative">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-2">
                  {getRankingIcon(index)}
                  <div className="flex items-center">
                    {product.imageUrl ? (
                      <div className="relative w-10 h-10 mr-2 overflow-hidden rounded-md border border-gray-200">
                        <Image 
                          src={product.imageUrl} 
                          alt={product.name} 
                          width={40} 
                          height={40} 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 mr-2 bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                    <p className="font-semibold text-sm">
                      {/* Extract only the base product name */}
                      {(() => {
                        // If no name, show default
                        if (!product.name) return `Product ${index + 1}`;
                        
                        // If special case, handle accordingly
                        if (product.name === "Product Name Unavailable") {
                          return (
                            <>
                              Product Name Unavailable
                              <span className="ml-1 text-xs text-orange-500">(ID: {product.productId.substring(0, 6)})</span>
                            </>
                          );
                        }
                        
                        // For normal product names, strip any variant info
                        // First try to split by common separators
                        const nameParts = product.name.split(/\s+[-–—]\s+|\s*,\s*/);
                        return nameParts[0]; // Return just the first part (base product name)
                      })()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-600">{product.salesCount} sold</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                <p className="text-xs text-gray-500">
                  {maxSalesCount > 0 ? Math.round((product.salesCount / maxSalesCount) * 100) : 0}% of top sales
                </p>
              </div>
              
              {/* Sales visualization bar */}
              <div className="mt-0.5 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-orange-500 h-1.5 rounded-full" 
                  style={{ width: `${percentWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 flex justify-between">
        <div className="text-xs text-gray-500">
          {products && products.length > 0 ? (
            <span>Based on {products.reduce((sum, p) => sum + p.salesCount, 0)} total units sold</span>
          ) : (
            <span>Loading sales data...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestSellingItems;