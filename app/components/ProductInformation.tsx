// components/ProductInformation.tsx
"use client";

import React, { useState } from "react";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaShareAlt,
  FaHeart,
} from "react-icons/fa";
import { ChevronDown } from "lucide-react"; // Import ChevronDown for the review dropdown

interface ProductInformationProps {
  product: any; // Replace 'any' with a more specific Product interface if you have one
}

const ProductInformation: React.FC<ProductInformationProps> = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = () => {
    alert(`Added ${quantity} ${product.name}(s) to the cart!`);
  };

  const addToWishlist = () => {
    alert(`${product.name} added to your wishlist!`);
  };

  const shareProduct = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Product link copied to clipboard!");
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    return (
      <div className="flex items-center">
        {" "}
        {/* Flex container for stars and count */}
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <FaStar key={i} className="text-yellow-400 text-[14px]" /> // Smaller stars
          ))}
        {halfStar && <FaStarHalfAlt className="text-yellow-400 text-[14px]" />}{" "}
        {/* Smaller half star */}
        {Array(5 - fullStars - (halfStar ? 1 : 0))
          .fill(0)
          .map((_, i) => (
            <FaRegStar key={i} className="text-yellow-400 text-[14px]" /> // Smaller empty stars
          ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        {" "}
        {/* Title and Share Icon container */}
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <button onClick={shareProduct} aria-label="Share Product">
          <FaShareAlt size={18} className="text-gray-600 hover:text-black" />
        </button>
      </div>
      <div className="flex items-center space-x-2 mb-3">
        {" "}
        {/* Rating and Reviews container */}
        {renderStars(product.rating)}
        <span className="text-gray-600 text-sm">({product.rating})</span>
        <button className="text-gray-600 text-sm focus:outline-none">
          (385) <ChevronDown className="inline-block align-middle w-4 h-4" />{" "}
          {/* Review count and dropdown */}
        </button>
      </div>
      <p className="text-2xl font-semibold mb-4">
        Rs.{product.price.toFixed(0)}
      </p>{" "}
      {/* Larger price */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Color: Jet Black</h3>{" "}
        {/* Color Label */}
        <div className="flex space-x-2 mt-2">
          {product.colors.map((color: string, index) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={` rounded-full border-2 border-gray-300  ${
                selectedColor === color ? "border-black" : ""
              }`}
              aria-label={`Color ${color}`}
            >
              <img
                src={`/color-swatch-${color.toLowerCase()}.png`} // Replace with your actual color swatch images and path
                alt={color}
                className="w-10 h-10 rounded-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-medium mb-2">Size:</h3> {/* Size Label */}
        <div className="flex space-x-2 mt-2">
          {product.sizes.map((size: string) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-3 py-2 rounded border border-gray-400 text-sm  ${
                selectedSize === size
                  ? "bg-black text-white border-black"
                  : "bg-white text-black"
              }`}
              aria-label={`Size ${size}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center space-x-4">
        <label className="text-lg font-medium">Quantity</label>
        <div className="flex border border-gray-300 rounded items-center">
          <button
            onClick={decrementQuantity}
            className="px-3 py-2 focus:outline-none"
            aria-label="Decrease Quantity"
          >
            -
          </button>
          <span className="px-4">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="px-3 py-2 focus:outline-none"
            aria-label="Increase Quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="mt-6 flex flex-col space-y-4">
        <button
          onClick={addToCart}
          className="bg-white text-black px-6 py-3 rounded border border-black font-semibold hover:bg-gray-100" // Updated style for ADD TO CART
        >
          ADD TO CART
        </button>
        <button
          onClick={addToWishlist}
          className="bg-white text-black px-6 py-3 rounded border border-black font-semibold hover:bg-gray-100 flex items-center justify-center space-x-2" // Updated style for WISHLIST
        >
          <FaHeart size={16} /> <span>ADD TO WISHLIST</span>
        </button>
        <button
          className="bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800" // Style for BUY IT NOW
        >
          BUY IT NOW
        </button>
      </div>
    </div>
  );
};

export default ProductInformation;
