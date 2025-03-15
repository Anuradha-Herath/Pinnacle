"use client";

import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Page() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPhoto(event.target.files[0]);
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        {/* Main container with image on the left and review form on the right */}
        <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6 flex flex-col md:flex-row gap-6">
          {/* Left Side: Product Image */}
          <div className="md:w-1/3 flex justify-center items-center">
            <img
              src="/p8.webp"
              alt="Lykon Tee"
              className="rounded-lg object-cover w-full"
            />
          </div>

          {/* Right Side: Review Form */}
          <div className="md:w-2/3">
            <h2 className="text-2xl font-semibold">Review this item</h2>
            <p className="text-gray-600 mb-4">Lykon Tee</p>

            {/* Rating Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-8 w-8 cursor-pointer ${
                      star <= rating ? "text-black" : "text-gray-300"
                    }`} // Changed from text-yellow-400
                    onClick={() => handleRating(star)}
                  />
                ))}
              </div>
            </div>

            {/* Review Textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium">Review</label>
              <p className="text-sm text-gray-500 mb-2">
                Write about what you did or didn&apos;t like about this product.
                Include details that would be helpful to other shoppers.
              </p>
              <textarea
                className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={4}
                placeholder="Write your review..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Add Your Photo
              </label>
              <div className="flex items-center space-x-4">
                {/* Dashed Box for Photo Upload */}
                <label
                  htmlFor="photo-upload"
                  className="w-24 h-24 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-md text-gray-400 cursor-pointer"
                >
                  {photo ? (
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Uploaded"
                      className="object-cover w-full h-full rounded-md"
                    />
                  ) : (
                    // Plus Icon for File Upload
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Optional help text */}
                {!photo && (
                  <p className="text-sm text-gray-500">
                    Create a name to show with your review.
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
