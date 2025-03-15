"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StarIcon } from "@heroicons/react/24/solid";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { toast } from "react-hot-toast";

export default function ProductReviewPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  // Form state
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [userName, setUserName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Product data state
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch product details
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Could not load product details');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhoto(file);
      
      // Convert to base64 for API submission
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      return toast.error('Please select a rating');
    }
    
    if (!review.trim()) {
      return toast.error('Please enter a review');
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userName: userName || 'Anonymous',
          rating,
          review,
          photoBase64: photoBase64,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      
      // Redirect back to product page after successful submission
      setTimeout(() => {
        router.push(`/product/${productId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-40 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 w-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state - product not found
  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500">Product Not Found</h2>
            <p className="mt-4">We couldn't find the product you're looking for.</p>
            <button 
              onClick={() => router.push('/shop')}
              className="mt-6 px-6 py-2 bg-black text-white rounded-md"
            >
              Back to Shop
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6 flex flex-col md:flex-row gap-6">
          {/* Left Side: Product Image */}
          <div className="md:w-1/3 flex justify-center items-center">
            <img
              src={product.gallery && product.gallery.length > 0 ? product.gallery[0].src : "/placeholder.png"}
              alt={product.productName}
              className="rounded-lg object-cover w-full"
            />
          </div>

          {/* Right Side: Review Form */}
          <div className="md:w-2/3">
            <h2 className="text-2xl font-semibold">Review this item</h2>
            <p className="text-gray-600 mb-4">{product.productName}</p>

            <form onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium">Your Name (Optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2 rounded-lg mt-1"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

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
                <label className="block text-sm font-medium">
                  Review <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Write about what you liked or didn&apos;t like about this product.
                  Include details that would be helpful to other shoppers.
                </p>
                <textarea
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows={4}
                  placeholder="Write your review..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Add Your Photo (Optional)
                </label>
                <div className="flex items-center space-x-4">
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

                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {photo ? (
                    <p className="text-sm text-green-500">Photo uploaded</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Attach a photo (optional)
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => router.push(`/product/${productId}`)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 bg-black text-white rounded-md ${
                    submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-800"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
