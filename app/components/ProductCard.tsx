"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";
import { cartNotifications, wishlistNotifications } from "@/lib/notificationService";
import { trackProductView } from "@/lib/userPreferenceService";

interface Product {
  id: string; 
  name: string;
  price: number;
  discountedPrice?: number;//add discount price
  image: string;
  colors: string[];
  sizes: string[];
  category?: string;       // Added missing property
  subCategory?: string;    // Added missing property
  discount?: {
    percentage: number;
    discountedPrice: number;
  };
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
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);
  
  // Add state for currently displayed image & selected variants
  const [currentImage, setCurrentImage] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Check for discounts when component mounts
  useEffect(() => {
    const checkForDiscounts = async () => {
      try {
        const response = await fetch(`/api/discounts/product/${product.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.discount && data.discount.active) {
            // Calculate the discounted price
            const percentage = data.discount.percentage;
            const discountAmount = (product.price * percentage) / 100;
            const discounted = product.price - discountAmount;
            
            setHasDiscount(true);
            setDiscountedPrice(discounted);
            setDiscountPercentage(percentage);
          }
        }
      } catch (error) {
        console.error("Error checking discounts:", error);
      }
    };
    
    checkForDiscounts();
  }, [product.id, product.price]);

  // Ensure we have valid data with defaults
  const productWithDefaults = {
    ...product,
    colors: product.colors || [],
    sizes: product.sizes || [],
  };

  // Update handleWishlistToggle to use the notification service
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
      // Use notification service instead of direct toast call
      wishlistNotifications.itemRemoved();
    } else {
      addToWishlist(product.id);
      // Use notification service instead of direct toast call
      wishlistNotifications.itemAdded();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only check for size selection if the product is not in Accessories category and has sizes
    const isAccessory = product.category === "Accessories";
    if (!isAccessory && productWithDefaults.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    // Check if product has a discount
  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice < product.price;
  
  // Calculate discount percentage
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100) 
    : 0;

    // Determine which color image is selected (if any)
    const colorImage = selectedColor || currentImage;
    
    // Important: Pass false to prevent duplicate notifications
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: colorImage || product.image,
      size: !isAccessory ? selectedSize || undefined : undefined,
      color: selectedColor || undefined
    }, false); // Set second parameter to false
    
    // Use notification service
    cartNotifications.itemAdded(product.name);
  };
  
  const navigateToProductDetail = () => {
    // Track the product view before navigating
    trackProductView({
      id: product.id,
      name: product.name,
      category: product.category || "",
      subCategory: product.subCategory || "",
      colors: product.colors || [],
      sizes: product.sizes || [],
      price: product.price
    });
    
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

  // Filter valid color images with improved validation - removed slice(0,3) to show all colors
  const validColorImages = Array.isArray(productWithDefaults.colors) ? 
    productWithDefaults.colors.filter(isValidImageUrl) : 
    [];

  // New handler for color image click - stores both image and color info
  const handleColorImageClick = (e: React.MouseEvent, colorImg: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(colorImg);
    setSelectedColor(colorImg); // Store the image URL as the color identifier
  };
  
  // New handler for size selection
  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <div
      className="w-[360px] min-w-[360px] bg-white shadow-md rounded-lg p-5 relative cursor-pointer hover:shadow-lg transition-shadow"
      onClick={navigateToProductDetail}
    >
      {/* Tag display element removed */}

      {!hideWishlist && (
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 ${
            isWishlisted ? "text-red-500" : "text-gray-600"
          } hover:scale-110 transition-all z-10`}
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      )}

      {/* Discount Badge - Moved to top right below wishlist heart */}
      {hasDiscount && discountPercentage && (
        <div className="absolute top-12 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          -{discountPercentage}%
        </div>
      )}

      <div className="w-full h-80 flex items-center justify-center">
        <Image
          src={productImage}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </div>
      <h3 className="mt-2 font-semibold">{product.name}</h3>

      {/* Price display with discount if available */}
      <div className="flex items-baseline">
        {hasDiscount && discountedPrice !== null ? (
          <>
            <p className="text-red-600 font-semibold">
              ${discountedPrice.toFixed(2)}
            </p>
            <p className="text-gray-500 text-sm line-through ml-2">
              ${product.price.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-gray-600">${product.price.toFixed(2)}</p>
        )}
      </div>

      {/* Color images with selection indicator */}
      {validColorImages.length > 0 && (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 max-w-full">
          {validColorImages.map((colorImg, index) => (
            <button
              key={index}
              onClick={(e) => handleColorImageClick(e, colorImg)}
              className={`min-w-[40px] w-10 h-10 border rounded-md overflow-hidden flex-shrink-0 ${
                currentImage === colorImg
                  ? "border-2 border-black"
                  : "border-gray-300"
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
          {/* Removed the additionalColorsCount indicator */}
        </div>
      )}

      {/* Sizes with selection indicator - only show for non-accessories */}
      {product.category !== "Accessories" &&
        productWithDefaults.sizes.length > 0 && (
          <div className="flex gap-2 mt-2">
            {productWithDefaults.sizes.slice(0, 5).map((size, index) => (
              <button
                key={index}
                onClick={(e) => handleSizeSelect(e, size)}
                className={`border px-3 py-1 rounded cursor-pointer transition-colors ${
                  selectedSize === size
                    ? "bg-black text-white border-black"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

      <div className="flex justify-start mt-4">
        <button
          onClick={handleAddToCart}
          className="px-10 bg-[#1D1D1D] text-white py-2.5 rounded-full hover:bg-gray-800 transition-colors text-base font-medium"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

