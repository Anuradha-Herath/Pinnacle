"use client";

import React, { useState, useEffect } from "react";
import { apiHelpers } from '../../lib/simpleRequestHelper';
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

interface Review {
  id?: string;
  _id?: string;
  name?: string;
  userName?: string;
  rating: number;
  comment?: string;
  review?: string;
  photoUrl?: string | null;
  createdAt?: string;
}

interface Props {
  reviews?: Review[];
  productId?: string;
  onRatingChange?: (rating: number) => void; // Add callback for rating changes
}

const UserReviewsSection: React.FC<Props> = ({ 
  reviews: initialReviews, 
  productId,
  onRatingChange 
}) => {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const initialReviewCount = 3; // Number of reviews to show initially

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
    
  // Notify parent component when rating changes
  useEffect(() => {
    if (reviews.length > 0 && onRatingChange) {
      const numRating = parseFloat(averageRating);
      onRatingChange(numRating);
    }
  }, [averageRating, onRatingChange, reviews.length]);

  useEffect(() => {
    // If productId is provided, fetch reviews from API
    if (productId) {
      const fetchReviews = async () => {
        try {
          setLoading(true);
          // Use deduplicated API helper instead of direct fetch
          const data = await apiHelpers.getProductReviews(productId);
          
          if (data.success && data.reviews) {
            setReviews(data.reviews);
          }
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setError('Failed to load reviews');
        } finally {
          setLoading(false);
        }
      };

      fetchReviews();
    }
  }, [productId]);

  // Map for star ratings
  const ratingCounts = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[5 - review.rating]++;
    }
  });

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return '';
    }
  };

  // Get the reviews to display based on showAllReviews state
  const displayedReviews = showAllReviews 
    ? reviews 
    : reviews.slice(0, initialReviewCount);

  return (
    <div className="mt-12 pt-6 border-t border-gray-200">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          {/* Custom pulse animation with grayscale colors only */}
          <style jsx>{`
            .custom-review-pulse {
              animation: customReviewPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes customReviewPulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
          <div className="custom-review-pulse flex flex-col w-full max-w-2xl">
            {/* Rating summary skeleton */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1">
                <div className="flex items-end gap-2 mb-2">
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 w-4 bg-gray-300 rounded-full"></div>
                    ))}
                  </div>
                </div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
              </div>
              <div className="flex-1 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-6 h-4 bg-gray-200 rounded mr-2"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-4 bg-gray-200 rounded ml-2"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Review placeholders */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {/* Reviews Summary */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Left: Overall Rating */}
            <div className="flex-1">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{averageRating}</span>
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(Number(averageRating))
                          ? "text-black"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Right: Rating Breakdown */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center mb-1">
                  <span className="text-sm w-6">{star}</span>
                  <div className="mx-2">
                    <StarIcon className="h-4 w-4 text-black" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{
                        width: `${
                          reviews.length
                            ? (ratingCounts[5 - star] / reviews.length) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 w-6">
                    {ratingCounts[5 - star]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          {productId && (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => router.push(`/productReview/${productId}`)}
                className="py-2 px-6 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
              >
                Write a Review
              </button>
            </div>
          )}

          {/* Review List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {displayedReviews.map((review) => (
                <div
                  key={review._id || review.id}
                  className="border-b border-gray-200 pb-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <React.Fragment key={i}>
                          {i < review.rating ? (
                            <StarIcon className="h-4 w-4 text-black" />
                          ) : (
                            <StarOutline className="h-4 w-4 text-gray-300" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="font-medium">
                      {review.userName || review.name || "Anonymous"}
                    </span>
                    {review.createdAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-3">
                    {review.review || review.comment || "No comment provided"}
                  </p>

                  {/* Review Photo if available */}
                  {review.photoUrl && (
                    <div className="mt-2">
                      <img
                        src={review.photoUrl}
                        alt="Review photo"
                        className="h-24 w-auto object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* See More / Show Less Button */}
              {reviews.length > initialReviewCount && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="py-2 px-6 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
                  >
                    {showAllReviews ? "Show Less" : `See ${reviews.length - initialReviewCount} More Reviews`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserReviewsSection;
