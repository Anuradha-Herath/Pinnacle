"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";

interface Product {
  id: string; // Changed from number to string to match MongoDB _id
  name: string;
  price: number;
  image: string;
  colors: string[];
  sizes: string[];
}

interface ProductCardProps {
  product: Product;
  hideWishlist?: boolean;
}

const ProductCard = ({ product, hideWishlist }: ProductCardProps) => {
  const router = useRouter();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);
  
  // Add state to track the currently displayed image
  const [currentImage, setCurrentImage] = useState(product.image);

  // Ensure we have valid data with defaults
  const productWithDefaults = {
    ...product,
    colors: product.colors || [],
    sizes: product.sizes || [],
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    
    // Optional: show a toast notification
    if (typeof toast !== 'undefined') {
      toast.success(`${product.name} added to cart!`);
    } else {
      alert(`${product.name} added to cart!`);
    }
  };
  
  const navigateToProductDetail = () => {
    router.push(`/product/${product.id}`);
  };

  // Enhanced image validation function
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === '') return false;
    
    // Check for known valid image paths
    const validBasePaths = ['/p1.webp', '/p2.webp', '/p3.webp', '/p4.webp', 
                          '/p5.webp', '/p6.webp', '/p7.webp', '/p8.webp', '/p9.webp',
                          '/placeholder.png'];
    
    if (validBasePaths.includes(url)) return true;
    
    // Path starts with '/' and has a valid image extension
    if (url.startsWith('/') && 
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) return true;
    
    try {
      // Check if it's a fully qualified URL
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Set default placeholder image
  const placeholderImage = '/placeholder.png'; 
  
  // Ensure image is valid with improved validation
  const productImage = isValidImageUrl(currentImage || product.image) ? 
    (currentImage || product.image) : placeholderImage;

  // Filter valid color images with improved validation
  const validColorImages = Array.isArray(productWithDefaults.colors) ? 
    productWithDefaults.colors
      .filter(isValidImageUrl)
      .slice(0, 3) : 
    [];

  // New handler for color image click
  const handleColorImageClick = (e: React.MouseEvent, colorImg: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(colorImg);
  };

  return (
    <div 
      className="w-[300px] min-w-[300px] bg-white shadow-md rounded-lg p-4 relative cursor-pointer hover:shadow-lg transition-shadow"
      onClick={navigateToProductDetail}
    >
      {!hideWishlist && (
        <button 
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 ${isWishlisted ? 'text-red-500' : 'text-gray-600'} hover:scale-110 transition-all z-10`}
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      )}
      <div className="w-full h-60 flex items-center justify-center">
        <Image
          src={productImage}
          alt={product.name}
          width={240}
          height={240}
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </div>
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price.toFixed(2)}</p>
      
      {/* Color images - only show if we have valid images */}
      {validColorImages.length > 0 && (
        <div className="flex gap-2 mt-2">
          {validColorImages.map((colorImg, index) => (
            <button
              key={index}
              onClick={(e) => handleColorImageClick(e, colorImg)}
              className={`w-10 h-10 border rounded-md overflow-hidden ${
                currentImage === colorImg ? 'border-2 border-black' : 'border-gray-300'
              }`}
            >
              <Image
                src={colorImg}
                alt={`Color ${index + 1}`}
                width={40}
                height={40}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImage;
                }}
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Sizes */}
      {productWithDefaults.sizes.length > 0 && (
        <div className="flex gap-2 mt-2">
          {productWithDefaults.sizes.slice(0, 5).map((size, index) => (
            <span
              key={index}
              className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-100"
            >
              {size}
            </span>
          ))}
        </div>
      )}
      
      <button 
        onClick={handleAddToCart}
        className="mt-3 w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
