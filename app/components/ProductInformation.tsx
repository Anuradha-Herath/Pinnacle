"use client";

import React, { useState, useEffect } from "react";
import { Star, Minus, Plus, ChevronDown, Copy, MessageCircle } from "lucide-react";
import Image from "next/image";
import SizeGuideModal from "./SizeGuideModal";

interface ProductInformationProps {
  product: {
    id?: string;          // Make id optional as it might be _id from MongoDB
    _id?: string;         // Add support for MongoDB's _id
    name: string;
    price: number;
    discountedPrice?: number; // Add discounted price field
    description: string;
    images: string[];
    sizes: string[];
    rating: number;
    category?: string;
    sizeChartImage?: string; // Add field for size chart image
  };
  quantity: number;
  updateQuantity: (value: number) => void;
  selectedSize: string | null;
  setSelectedSize: (size: string) => void;
  onImageSelect?: (index: number) => void;
}

const ProductInformation: React.FC<ProductInformationProps> = ({ 
  product, 
  quantity, 
  updateQuantity, 
  selectedSize, 
  setSelectedSize,
  onImageSelect 
}) => {
  // State for size guide modal
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  // State for description expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // State for category data including size guide image
  const [categoryData, setCategoryData] = useState<{
    title?: string;
    sizeGuideImage?: string | null;
  } | null>(null);
  // State for loading indicator
  const [isLoadingSizeGuide, setIsLoadingSizeGuide] = useState(false);

  // Social media sharing functions
  const shareOnTwitter = () => {
    const shareText = `Check out this ${product.name}!`;
    const shareUrl = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnFacebook = () => {
    const shareUrl = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const shareText = `Check out this ${product.name}! ${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
  };
    
  
  // Determine product ID
  const productId = product.id || product._id;
  
  // Check if product is an accessory
  const isAccessory = product.category === "Accessories";

  // Check if product has a discount
  const hasDiscount = product.discountedPrice !== undefined && 
                     product.discountedPrice < product.price;
  
  // Calculate discount percentage if discounted
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100) 
    : 0;
  
    // State for selected image index
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handleImageSelect = (index: number) => {
      setSelectedImageIndex(index);
      if (onImageSelect) {
        onImageSelect(index);
      }
    };
    
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
      
      {/* Price - Updated to show both regular and discounted price */}
      <div className="mb-6">
        {hasDiscount ? (
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-red-600">
              ${product.discountedPrice!.toFixed(2)}
            </p>
            <p className="text-lg text-gray-500 line-through">
              ${product.price.toFixed(2)}
            </p>
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded">
              -{discountPercentage}%
            </span>
          </div>
        ) : (
          <p className="text-2xl font-semibold">${product.price.toFixed(2)}</p>
        )}
      </div>
      
      {/* Product Images - Replacing color circles */}
      {product.images && product.images.length > 1 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-2">Available Colors</h2>
          <div className="flex space-x-3 overflow-x-auto py-2">
            {product.images.map((image, index) => (
              <button
              key={index}
              onClick={() => handleImageSelect(index)} // Use the updated handler
              className={`relative w-16 h-16 border-2 rounded-md overflow-hidden transition-all hover:scale-105 ${
                selectedImageIndex === index ? 'border-black' : 'border-gray-200'
              }`}
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
              onClick={() => {
                console.log("Opening size guide modal with:", {
                  category: product.category,
                  sizeChartImage: product.sizeChartImage // Pass product's size chart image
                });
                setIsSizeGuideOpen(true);
              }} 
              className="text-xs flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
              disabled={isLoadingSizeGuide}
            >
              {isLoadingSizeGuide ? (
                <>
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin mr-1"></span>
                  Loading...
                </>
              ) : (
                <>
                  Size Guide
                  {product.sizeChartImage ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Size guide available"></span>
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-1" title="No size guide found"></span>
                  )}
                </>
              )}
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
      
       {/* Social Media Sharing */}
       <div className="mb-8">
        <h2 className="text-sm font-medium mb-2">Share</h2>
        <div className="flex space-x-3">
            <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Page URL copied to clipboard!");
            }}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            aria-label="Copy Page URL"
            >
           
            <Copy size={20} className="text-black-800" />
            </button>
           <button
            onClick={shareOnWhatsApp}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle size={20} className="text-black-800" />
          </button>
          {/* Pinterest sharing button removed as 'Pinterest' icon is not available */}
        </div>
      </div>

      {/* Description */}
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
          sizeChartImage={product.sizeChartImage} // Pass the sizeChartImage to SizeGuideModal
        />
      )}
    </div>
  );
};

export default ProductInformation;
