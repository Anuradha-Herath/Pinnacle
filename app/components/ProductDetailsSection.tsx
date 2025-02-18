// components/ProductDetailsSection.tsx
"use client";

import React from "react";

interface ProductDetailsSectionProps {
  details: string[];
}

const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({
  details,
}) => {
  return (
    <div className="mt-8 pt-4 border-t border-gray-200">
      {" "}
      {/* Added border and spacing */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {" "}
        {/* Updated heading style */}
        Product Details
      </h3>
      <ul className="list-disc ml-5 text-gray-600">
        {" "}
        {/* Updated list style */}
        {details.map((detail, index) => (
          <li key={index} className="mb-2 text-sm leading-relaxed">
            {" "}
            {/* Updated list item style */}
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductDetailsSection;
