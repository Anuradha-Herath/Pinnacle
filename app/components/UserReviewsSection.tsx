"use client";

import React, { useState } from "react";
import { Star, ChevronDown, MessageSquare } from "lucide-react";

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
}

interface UserReviewsSectionProps {
  reviews: Review[];
}

const UserReviewsSection: React.FC<UserReviewsSectionProps> = ({ reviews }) => {
  const [expanded, setExpanded] = useState(true);
  
  if (!reviews || reviews.length === 0) return null;
  
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="border-b py-6 mb-10">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex justify-between items-center w-full"
      >
        <h2 className="text-lg font-semibold flex items-center">
          <MessageSquare size={20} className="mr-2" />
          Customer Reviews ({reviews.length})
        </h2>
        <ChevronDown 
          size={20} 
          className={`transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>
      
      {expanded && (
        <div className="mt-6">
          {/* Average Rating */}
          <div className="flex items-center mb-6">
            <div className="flex text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  fill={i < Math.round(averageRating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              Based on {reviews.length} reviews
            </span>
          </div>
          
          {/* Individual Reviews */}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{review.name}</h3>
                  <div className="flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
          
          {/* Write a Review button */}
          <button className="mt-6 flex items-center text-blue-600 hover:text-blue-800">
            <MessageSquare size={16} className="mr-1" />
            Write a Review
          </button>
        </div>
      )}
    </div>
  );
};

export default UserReviewsSection;
