// components/UserReviewsSection.tsx
"use client";

import React, { useState } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { ChevronDown } from "lucide-react";

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string; // Added date to the review interface
}

interface UserReviewsSectionProps {
  reviews: Review[];
}

const UserReviewsSection: React.FC<UserReviewsSectionProps> = ({ reviews }) => {
  const renderStars = (rating: number, starSize: string = "text-base") => {
    // Added starSize prop
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    return (
      <div className="flex items-center">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <FaStar key={i} className={`text-yellow-400 ${starSize}`} /> // Use starSize
          ))}
        {halfStar && (
          <FaStarHalfAlt className={`text-yellow-400 ${starSize}`} />
        )}{" "}
        {/* Use starSize */}
        {Array(5 - fullStars - (halfStar ? 1 : 0))
          .fill(0)
          .map((_, i) => (
            <FaRegStar key={i} className={`text-yellow-400 ${starSize}`} /> // Use starSize
          ))}
      </div>
    );
  };

  // Calculate rating percentages for the bar chart (simplified for static data)
  const ratingCounts = reviews.reduce((counts, review) => {
    counts[review.rating] = (counts[review.rating] || 0) + 1;
    return counts;
  }, {});

  const totalReviews = reviews.length;
  const getPercentage = (starRating: number) => {
    return ((ratingCounts[starRating] || 0) / totalReviews) * 100;
  };

  return (
    <div className="mt-12 pt-6 border-t border-gray-200">
      {" "}
      {/* Increased mt, added pt and border */}
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        {" "}
        {/* Updated heading style and margin */}
        Reviews
      </h3>
      <div className="flex items-start mb-8">
        {" "}
        {/* Overall Rating Section */}
        <div className="mr-8 text-center">
          <div className="text-4xl font-bold text-gray-800">
            {productRating.toFixed(1)}{" "}
            <span className="text-base font-normal text-gray-600">
              out of 5
            </span>
          </div>{" "}
          {/* Larger rating number */}
          <div className="mb-2">
            {renderStars(productRating, "text-lg")}
          </div>{" "}
          {/* Larger stars for overall rating */}
          <button className="text-gray-600 text-sm focus:outline-none">
            {`(${totalReviews}) Reviews`}
          </button>
        </div>
        <div className="flex-1">
          {" "}
          {/* Rating Breakdown Bars */}
          {[5, 4, 3, 2, 1].map((starRating) => (
            <div key={starRating} className="flex items-center mb-1">
              <div className="w-8 text-sm text-gray-600">
                {starRating} stars
              </div>{" "}
              {/* Star label */}
              <div className="ml-2 bg-gray-200 h-2 w-full rounded-full overflow-hidden relative">
                {" "}
                {/* Bar container */}
                <div
                  className="bg-yellow-400 h-full rounded-full absolute left-0 top-0"
                  style={{ width: `${getPercentage(starRating)}%` }} // Dynamic width based on percentage
                ></div>
              </div>
              <div className="ml-2 w-8 text-sm text-gray-600 text-right">
                {getPercentage(starRating).toFixed(0)}%
              </div>{" "}
              {/* Percentage label */}
            </div>
          ))}
        </div>
      </div>
      {reviews.length === 0 ? (
        <p className="text-gray-700 mt-2">No reviews yet.</p>
      ) : (
        <div className="space-y-6">
          {" "}
          {/* Increased space between reviews */}
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              {" "}
              {/* Review Card style */}
              <div className="flex justify-between items-center mb-2">
                {" "}
                {/* Name, Rating and Date Row */}
                <div className="font-semibold text-gray-800">
                  {review.name}
                </div>{" "}
                {/* Reviewer Name */}
                <div className="text-gray-600 text-sm">{review.date}</div>{" "}
                {/* Review Date */}
              </div>
              <div className="flex items-center space-x-2 mb-3">
                {" "}
                {/* Stars below name */}
                {renderStars(review.rating, "text-sm")}
                <span className="text-gray-600 text-sm">
                  ({review.rating.toFixed(1)})
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {review.comment.length > 200
                  ? `${review.comment.substring(0, 200)}...`
                  : review.comment}
                {review.comment.length > 200 && (
                  <button className="text-blue-500 text-sm ml-1 focus:outline-none">
                    Show more
                  </button> // "Show more" button
                )}
              </p>
            </div>
          ))}
        </div>
      )}
      {reviews.length > 0 && (
        <div className="text-center mt-6">
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none">
            {" "}
            {/* "Load more" Button */}
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

// Dummy product rating (replace with actual average rating if available)
const productRating = 4.5;

export default UserReviewsSection;
