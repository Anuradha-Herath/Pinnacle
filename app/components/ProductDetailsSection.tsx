"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProductDetailsSectionProps {
  details: string[];
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({ details }) => {
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
        </div>
      )}
    </div>
  );
};

export default ProductDetailsSection;
