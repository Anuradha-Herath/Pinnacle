"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStar, FaStarHalfAlt, FaRegStar, FaShareAlt } from "react-icons/fa";

const SingleProductPage = () => {
  const router = useRouter();
  const [product] = useState({
    id: 1,
    name: "Black T-Shirt",
    price: 25.99,
    image: "/images/tshirt.jpg",
    description:
      "A stylish and comfortable black t-shirt made from 100% cotton.",
    details: [
      "100% Cotton",
      "Machine washable",
      "Unisex fit",
      "Available in multiple colors",
    ],
    rating: 4.5,
    colors: ["Black", "White", "Gray", "Blue"],
    sizes: ["S", "M", "L", "XL"],
  });
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [reviews] = useState([
    { id: 1, name: "John Doe", rating: 5, comment: "Great quality and fit!" },
    {
      id: 2,
      name: "Jane Smith",
      rating: 4,
      comment: "Nice design, but the fabric is a bit thin.",
    },
  ]);

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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    return (
      <>
        {Array(fullStars)
          .fill()
          .map((_, i) => (
            <FaStar key={i} className="text-yellow-400" />
          ))}
        {halfStar && <FaStarHalfAlt className="text-yellow-400" />}
        {Array(5 - fullStars - (halfStar ? 1 : 0))
          .fill()
          .map((_, i) => (
            <FaRegStar key={i} className="text-yellow-400" />
          ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg shadow-md"
          />
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <div className="flex items-center space-x-2 mt-2">
              {renderStars(product.rating)}
              <span className="text-gray-600">({product.rating})</span>
            </div>
            <p className="mt-2 text-lg">${product.price.toFixed(2)}</p>
            <p className="mt-4 text-gray-700">{product.description}</p>
            <div className="mt-4">
              <h3 className="font-medium">Color:</h3>
              <div className="flex space-x-3 mt-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedColor === color
                        ? "bg-black text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium">Size:</h3>
              <div className="flex space-x-3 mt-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md border ${
                      selectedSize === size
                        ? "bg-black text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-center space-x-4">
              <label className="text-lg font-medium">Quantity:</label>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-16 p-2 border rounded-md text-center bg-gray-200"
              />
            </div>
            <div className="mt-6 flex space-x-4">
              <button
                onClick={addToCart}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
              >
                Add to Cart
              </button>
              <button
                onClick={addToWishlist}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Add to Wishlist
              </button>
              <button
                onClick={shareProduct}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <FaShareAlt />
                <span>Share</span>
              </button>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Product Details:</h3>
              <ul className="list-disc ml-5 mt-2 text-gray-700">
                {product.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 text-gray-600 underline"
            >
              Back to Shop
            </button>
          </div>
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold">User Reviews:</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-700 mt-2">No reviews yet.</p>
          ) : (
            <div className="mt-2 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-gray-600 text-sm">
                      ({review.rating})
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700">{review.comment}</p>
                  <p className="mt-1 text-sm text-gray-500">- {review.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleProductPage;
