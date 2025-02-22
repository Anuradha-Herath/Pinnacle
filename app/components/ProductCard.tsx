"use client";

import React from "react";
import { Heart } from "lucide-react";

interface Product {
  id: number;
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
  return (
    <div className="w-[300px] min-w-[300px] bg-white shadow-md rounded-lg p-4 relative">
      {!hideWishlist && (
        <button className="absolute top-3 right-3 text-gray-600 hover:text-red-500">
          <Heart size={20} />
        </button>
      )}
      <div className="w-full h-60 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain rounded-md"
        />
      </div>
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price}</p>
      <div className="flex gap-2 mt-2">
        {product.colors.map((colorImg, index) => (
          <img
            key={index}
            src={colorImg}
            alt={`Color ${index + 1}`}
            className="w-10 h-10 object-contain rounded-md border cursor-pointer hover:border-black"
          />
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {product.sizes.map((size, index) => (
          <span
            key={index}
            className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-100"
          >
            {size}
          </span>
        ))}
      </div>
      <button className="mt-3 w-full bg-black text-white py-2 rounded hover:bg-gray-800">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
