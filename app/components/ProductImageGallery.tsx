"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  additionalImages?: string[];
  selectedImage?: number;
  onImageSelect?: (index: number) => void;
  onThumbnailClick?: (index: number) => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images,
  additionalImages = [],
  selectedImage = 0, 
  onImageSelect,
  onThumbnailClick
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
  
  // Optimized handler with direct state updates
  const handleThumbnailClick = (index: number) => {
    // Handle main color image clicks
    if (index === 0 && onImageSelect) {
      onImageSelect(selectedImage);
      return;
    }
    
    // Fast path for just updating the active image
    setActiveImageIndex(index);
    
    // Notify parent component if needed
    if (onThumbnailClick) {
      onThumbnailClick(index);
    }
  };

  // Use the active image URL directly from allImages for better performance
  const activeImageUrl = allImages[activeImageIndex] || placeholderImage;

  return (
    <div className="space-y-4">
      {/* Main Image - optimized with explicit width/height */}
      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        <Image
          src={activeImageUrl}
          alt="Product image"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          // Add specific image dimensions to reduce layout shifts
          style={{objectFit: 'contain'}}
        />
      </div>

      {/* Thumbnails - only render if there are multiple images */}
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
                  // Use loading="eager" for visible thumbnails
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
