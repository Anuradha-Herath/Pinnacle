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

  // If no products are provided, use placeholder data
  const displayProducts = products && products.length > 0 
    ? products.slice(0, 3).map(product => ({
        ...product,
        // Ensure product has a valid name
        name: product.name && product.name !== "undefined" ? product.name : `Product ID: ${product.productId.substring(0, 8)}...`
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
    <div className="bg-white p-3 rounded shadow h-[250px] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Top 3 Trending Products</h3>
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">By Order Count</span>
      </div>
      
      <div className="space-y-2">
        {displayProducts.map((product, index) => {
          // Calculate width percentage for sales visualization
          const percentWidth = maxSalesCount > 0
            ? (product.salesCount / maxSalesCount) * 100
            : 0;
            
          return (
            <div key={product.productId} className="relative">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-1.5">
                  {getRankingIcon(index)}
                  <p className="font-semibold text-sm">
                    {product.name || `Product ${index + 1}`}
                    {product.name === "Product Name Unavailable" && (
                      <span className="ml-1 text-xs text-orange-500">(ID: {product.productId.substring(0, 6)})</span>
                    )}
                  </p>
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