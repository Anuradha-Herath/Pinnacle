"use client";

import React, { useState } from "react";
import { Star, Minus, Plus, ChevronDown } from "lucide-react";
import Image from "next/image";
import SizeGuideModal from "./SizeGuideModal";

interface ProductInformationProps {
  product: {
    name: string;
    price: number;
    description: string;
    images: string[]; // Use images array instead of colors array
    sizes: string[];
    rating: number;
    category?: string; // Add category property to check if it's an accessory
  };
  quantity: number;
  updateQuantity: (value: number) => void;
  selectedSize: string | null;
  setSelectedSize: (size: string) => void;
  onImageSelect?: (index: number) => void; // Add callback to handle image selection
}

const ProductInformation: React.FC<ProductInformationProps> = ({ 
  product, 
  quantity, 
  updateQuantity, 
  selectedSize, 
  setSelectedSize,
  onImageSelect 
}) => {
  // Add state for size guide modal
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  // Add state for description expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Check if product is an accessory
  const isAccessory = product.category === "Accessories";

  // Generate stars for rating
  const renderRatingStars = () => {
    const stars = [];
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 > 0.2; // Show half star if decimal part > 0.2
    
    // Handle case when no ratings exist
    if (product.rating === 0) {
      for (let i = 0; i < 5; i++) {
        stars.push(<Star key={`empty-${i}`} size={18} className="text-gray-300" />);
      }
      return stars;
    }
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={18} fill="currentColor" />);
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star size={18} className="text-gray-300" fill="currentColor" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star size={18} fill="currentColor" />
          </div>
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={18} className="text-gray-300" />
      );
    }
    
    return stars;
  };

  // Placeholder image for error handling
  const placeholderImage = '/placeholder.png';

  return (
    <div>
      {/* Product Name */}
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      
      {/* Rating */}
      <div className="flex items-center mb-4">
        <div className="flex text-black mr-2">
          {renderRatingStars()}
        </div>
        <span className="text-gray-600 text-sm">
          {product.rating > 0 
            ? `(${product.rating.toFixed(1)} stars)` 
            : "(No ratings yet)"}
        </span>
      </div>
      
      {/* Price */}
      <p className="text-2xl font-semibold mb-6">${product.price.toFixed(2)}</p>
      
      {/* Product Images - Replacing color circles */}
      {product.images && product.images.length > 1 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Available Colors</h2>
          <div className="flex space-x-3 overflow-x-auto py-2">
            {product.images.map((image, index) => (
              <button 
                key={index} 
                onClick={() => onImageSelect && onImageSelect(index)}
                className="relative w-16 h-16 border-2 rounded-md overflow-hidden transition-all hover:scale-105"
              >
                <Image
                  src={image || placeholderImage}
                  alt={`Product variant ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderImage;
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Sizes - Only show for non-accessories */}
      {!isAccessory && product.sizes && product.sizes.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium">Size</h2>
            <button 
              onClick={() => setIsSizeGuideOpen(true)} 
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              Size Guide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border text-sm transition-colors ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-gray-300 hover:border-gray-500"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Quantity */}
      <div className="mb-8">
        <h2 className="text-sm font-medium mb-2">Quantity</h2>
        <div className="inline-flex items-center border">
          <button
            onClick={() => updateQuantity(-1)}
            className="px-4 py-2 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="px-6 py-2 border-x">{quantity}</span>
          <button
            onClick={() => updateQuantity(1)}
            className="px-4 py-2 hover:bg-gray-100"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Description - Moved below sizes and quantity with enhanced styling */}
      <div className="my-8 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
        <button 
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          className="flex justify-between items-center w-full p-4 text-left bg-white"
        >
          <span className="text-lg font-medium text-gray-900">Description</span>
          <ChevronDown 
            size={20} 
            className={`transition-transform duration-300 text-gray-500 ${isDescriptionExpanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
        
        {isDescriptionExpanded && (
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal - only show for non-accessories */}
      {!isAccessory && (
        <SizeGuideModal 
          isOpen={isSizeGuideOpen} 
          onClose={() => setIsSizeGuideOpen(false)} 
          category="apparel" 
        />
      )}
    </div>
  );
};

export default ProductInformation;
