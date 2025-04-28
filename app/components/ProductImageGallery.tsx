"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  additionalImages?: string[];
  selectedImage: number;
  onImageSelect: (index: number) => void;
  onThumbnailClick?: (index: number) => void;
  isOutOfStock?: boolean; // Add out of stock parameter
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images,
  additionalImages = [],
  selectedImage, 
  onImageSelect,
  onThumbnailClick,
  isOutOfStock = false // Default to false
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const placeholderImage = '/placeholder.png';
  
  // Use useMemo to avoid recalculating allImages on every render
  const allImages = useMemo(() => {
    // Get the selected main image
    const mainImage = images[selectedImage] || '';
    
    // Combine and filter in a single pass for better performance
    return [mainImage, ...additionalImages].filter(url => {
      if (!url || url.trim() === '') return false;
      
      try {
        if (url.startsWith('/')) return true;
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    });
  }, [images, additionalImages, selectedImage]);
  
  // Reset active image when color changes (but not on every render)
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedImage, additionalImages.length]);

  // Early return if no images
  if (allImages.length === 0) {
    return (
      <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }
  
  // Fixed thumbnail click handler to allow clicking the main image thumbnail
  const handleThumbnailClick = (index: number) => {
    // Always update which image is displayed in the main area first
    setActiveImageIndex(index);
    
    // Notify parent component if the callback exists (for tracking)
    if (onThumbnailClick) {
      onThumbnailClick(index);
    }
    
    // Only handle color selection if it's a direct color selection action
    // (we don't want to change colors when just viewing images)
    // This part is now separate from displaying the image
  };

  // Use the active image URL directly from allImages for better performance
  const activeImageUrl = allImages[activeImageIndex] || placeholderImage;

  return (
    <div className="space-y-4">
      {/* Main image - add blur filter only if explicitly out of stock */}
      <div className="relative h-[500px] w-full bg-gray-50 rounded-lg overflow-hidden">
        <Image
          src={activeImageUrl || placeholderImage}
          alt="Product Image"
          fill
          className={`object-contain ${isOutOfStock ? 'filter blur-sm' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </div>

      {/* Thumbnails - now with proper active state tracking */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {allImages.map((src, index) => (
            <button
              key={`thumb-${selectedImage}-${index}`}
              className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 snap-start
                ${index === activeImageIndex ? "border-black" : "border-transparent"}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <div className="relative w-full h-full">
                <Image
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading={index < 4 ? "eager" : "lazy"}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
