"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  selectedImage?: number;
  onImageSelect?: (index: number) => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images,
  selectedImage = 0, 
  onImageSelect 
}) => {
  const [internalSelectedImage, setInternalSelectedImage] = useState(selectedImage);
  const placeholderImage = '/placeholder.png';
  
  // Update internal state when prop changes
  useEffect(() => {
    setInternalSelectedImage(selectedImage);
  }, [selectedImage]);

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === '') return false;
    
    try {
      if (url.startsWith('/')) return true;
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Filter only valid image URLs
  const validImages = images
    .filter(isValidImageUrl)
    .map(url => url.startsWith('data:') ? placeholderImage : url);

  if (validImages.length === 0) {
    return (
      <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }
  
  const handleThumbnailClick = (index: number) => {
    setInternalSelectedImage(index);
    if (onImageSelect) {
      onImageSelect(index);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        <Image
          src={validImages[internalSelectedImage]}
          alt={`Product image ${internalSelectedImage + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {validImages.map((src, index) => (
            <button
              key={index}
              className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition ${
                internalSelectedImage === index ? "border-black" : "border-transparent"
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                src={src}
                alt={`Thumbnail ${index + 1}`}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
