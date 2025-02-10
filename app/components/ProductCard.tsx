import React, { useState } from "react";
import { Heart } from "lucide-react";

const ProductCard = ({
  product,
}: {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    colors: string[];
    sizes: string[];
  };
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="relative w-[300px] min-w-[300px] bg-white shadow-md rounded-lg p-4">
      {/* Wishlist Button */}
      <button
        onClick={() => setIsWishlisted(!isWishlisted)}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
      >
        <Heart fill={isWishlisted ? "red" : "none"} size={24} />
      </button>

      {/* Product Image */}
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-40 object-cover rounded-md"
      />

      {/* Product Info */}
      <h3 className="mt-2 font-semibold">{product.name}</h3>
      <p className="text-gray-600">${product.price}</p>

      {/* Color Options */}
      <div className="mt-2 flex space-x-2">
        {product.colors.map((color) => (
          <span
            key={color}
            className="w-5 h-5 rounded-full border border-gray-300"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Size Options */}
      <div className="mt-2 flex space-x-2">
        {product.sizes.map((size) => (
          <span
            key={size}
            className="px-3 py-1 text-sm border border-gray-300 rounded"
          >
            {size}
          </span>
        ))}
      </div>

      {/* Add to Cart Button */}
      <button className="mt-3 bg-black text-white py-1 px-3 rounded w-full">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
