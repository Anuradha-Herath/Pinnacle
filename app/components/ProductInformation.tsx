"use client";

import React from "react";
import { Star, Minus, Plus } from "lucide-react";
import Image from "next/image";

interface ProductInformationProps {
  product: {
    name: string;
    price: number;
    description: string;
    images: string[]; // Use images array instead of colors array
    sizes: string[];
    rating: number;
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
  // Generate stars for rating
  const renderRatingStars = () => {
    const stars = [];
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 !== 0;
    
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
        <div className="flex text-yellow-500 mr-2">
          {renderRatingStars()}
        </div>
        <span className="text-gray-600 text-sm">({product.rating} stars)</span>
      </div>
      
      {/* Price */}
      <p className="text-2xl font-semibold mb-4">${product.price.toFixed(2)}</p>
      
      {/* Description */}
      <p className="text-gray-700 mb-6">{product.description}</p>
      
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
      
      {/* Sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium">Size</h2>
            <button className="text-xs text-blue-600 underline">Size Guide</button>
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
      <div className="mb-6">
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
    </div>
  );
};

export default ProductInformation;
