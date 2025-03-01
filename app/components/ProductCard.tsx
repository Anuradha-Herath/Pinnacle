"use client";

import React from "react";
import { Heart } from "lucide-react";
import Image from "next/image";
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
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);

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

  const handleAddToCart = () => {
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

  return (
    <div className="w-[300px] min-w-[300px] bg-white shadow-md rounded-lg p-4 relative">
      {!hideWishlist && (
        <button 
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 ${isWishlisted ? 'text-red-500' : 'text-gray-600'} hover:scale-110 transition-all`}
        >
          <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      )}
      <div className="w-full h-60 flex items-center justify-center">
        <Image
          src={product.image}
          alt={product.name}
          width={240}
          height={240}
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = '/placeholder.png';
          }}
        />
      </div>
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price.toFixed(2)}</p>
      
      {/* Color images */}
      {productWithDefaults.colors.length > 0 && (
        <div className="flex gap-2 mt-2">
          {productWithDefaults.colors.slice(0, 3).map((colorImg, index) => (
            <Image
              key={index}
              src={colorImg}
              alt={`Color ${index + 1}`}
              width={40}
              height={40}
              className="w-10 h-10 object-contain rounded-md border cursor-pointer hover:border-black"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = '/placeholder.png';
              }}
            />
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
