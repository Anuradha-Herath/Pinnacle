"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProductDetailsSectionProps {
  details: string[];
  occasions?: string[];
  style?: string[];
  season?: string[];
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({ details, occasions, style, season }) => {
  const [expanded, setExpanded] = useState(true);
  
  if (!details || details.length === 0) return null;

  return (
    <div className="border-t border-b py-6 my-10">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center w-full"
      >
        <h2 className="text-lg font-semibold">Product Details</h2>
        <ChevronDown 
          size={20} 
          className={`transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>
      
      {expanded && (
        <div className="mt-4 text-gray-700">
          <ul className="space-y-2 list-disc pl-5">
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>

          {/* Occasion badges */}
          {occasions && occasions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Perfect for:</h3>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occasion, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {occasion}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Style badges */}
          {style && style.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Style:</h3>
              <div className="flex flex-wrap gap-2">
                {style.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Season badges */}
          {season && season.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Best for seasons:</h3>
              <div className="flex flex-wrap gap-2">
                {season.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetailsSection;
