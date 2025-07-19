"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { handleImageError, getValidImageUrl, optimizeCloudinaryUrl, createImageProps } from "@/lib/imageUtils";

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
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
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
    setImageLoadErrors(new Set()); // Reset error tracking when images change
  }, [selectedImage, additionalImages.length]);

  // Early return if no images
  if (allImages.length === 0) {
    return (
      <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }
  
  // Enhanced error handler with retry mechanism
  const handleImageLoadError = (src: string) => {
    setImageLoadErrors(prev => new Set([...prev, src]));
    
    // For Cloudinary images, try direct access as fallback
    if (src.includes('cloudinary.com')) {
      return optimizeCloudinaryUrl(src, {
        width: 800,
        quality: 80,
        format: 'webp',
        fallback: true
      });
    }
    
    return placeholderImage;
  };

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
  const activeImageUrl = getValidImageUrl(allImages[activeImageIndex]) || placeholderImage;

  return (
    <div className="space-y-4">
      {/* Main image - add blur filter only if explicitly out of stock */}
      <div className="relative h-[500px] w-full bg-gray-50 rounded-lg overflow-hidden">
        <Image
          {...createImageProps(
            activeImageUrl,
            "Product Image",
            {
              priority: true,
              className: `object-contain ${isOutOfStock ? 'filter blur-sm' : ''}`,
            }
          )}
          fill
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const fallbackUrl = handleImageLoadError(target.src);
            if (target.src !== fallbackUrl) {
              target.src = fallbackUrl;
            }
          }}
        />
      </div>

      {/* Thumbnails - now with proper active state tracking */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {allImages.map((src, index) => {
            const thumbnailSrc = getValidImageUrl(src);
            return (
              <button
                key={`thumb-${selectedImage}-${index}`}
                className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 snap-start
                  ${index === activeImageIndex ? "border-black" : "border-transparent"}`}
                onClick={() => handleThumbnailClick(index)}
              >
                <div className="relative w-full h-full">
                  <Image
                    {...createImageProps(
                      thumbnailSrc,
                      `Thumbnail ${index + 1}`,
                      {
                        className: "object-cover",
                        priority: index < 4,
                      }
                    )}
                    fill
                    sizes="80px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallbackUrl = handleImageLoadError(target.src);
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
