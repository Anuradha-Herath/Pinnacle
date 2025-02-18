// components/ProductImageGallery.tsx
"use client";

import React, { useState } from "react";

interface ProductImageGalleryProps {
  images: string[]; // Array of image URLs - Expecting 3 images in this layout
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
}) => {
  if (images.length !== 3) {
    return <div>Product Image Gallery requires exactly 3 images.</div>; // Basic error handling
  }
  const [mainImage, setMainImage] = useState<string | null>(images[0] || null); // Default to the first image

  const handleThumbnailClick = (imageSrc: string) => {
    setMainImage(imageSrc);
  };

  // **Increased imageContainerSize to 250px x 250px**
  const imageContainerSize = "w-[250px] h-[250px]"; // Increased size

  return (
    <div className="product-image-gallery flex flex-col">
      {/* Top Two Images (Side-by-side) */}
      <div className="top-images flex space-x-2 mb-2 justify-center">
        {" "}
        {/* Added justify-center */}
        {/* Image 1 */}
        <div
          className={`rounded-lg overflow-hidden shadow-md ${imageContainerSize}`}
        >
          {" "}
          {/* Apply fixed size here */}
          <img
            src={images[0]}
            alt="Product Image 1"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setMainImage(images[0])}
          />
        </div>
        {/* Image 2 */}
        <div
          className={`rounded-lg overflow-hidden shadow-md ${imageContainerSize}`}
        >
          {" "}
          {/* Apply fixed size here */}
          <img
            src={images[1]}
            alt="Product Image 2"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setMainImage(images[1])}
          />
        </div>
      </div>

      {/* Bottom Image (Full Width - but now with fixed size as well, and centered) */}
      <div
        className="bottom-image rounded-lg overflow-hidden shadow-md mx-auto  mb-2"
        style={{ width: "250px", height: "250px" }}
      >
        {" "}
        {/* Applied increased fixed size and mx-auto for centering */}
        <img
          src={images[2]}
          alt="Product Image 3"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setMainImage(images[2])}
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
