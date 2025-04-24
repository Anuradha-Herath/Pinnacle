"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import ProductCarousel from "../../../components/ProductCarousel";
import ProductImageGallery from "../../../components/ProductImageGallery";
import ProductInformation from "../../../components/ProductInformation";
import UserReviewsSection from "../../../components/UserReviewsSection";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { toast } from "react-hot-toast";
import { Heart, ShoppingBag } from "lucide-react";
import { cartNotifications, wishlistNotifications } from "@/lib/notificationService";
import { trackProductView, trackProductAction } from "@/lib/userPreferenceService";

// Fix the debounce utility to properly handle 'this' context using arrow function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function EnhancedProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // State to hold product data
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [productRating, setProductRating] = useState<number>(0); // Add state for real rating
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [currentAdditionalImages, setCurrentAdditionalImages] = useState<string[]>([]);
  const [displayedImageIndex, setDisplayedImageIndex] = useState(0); // Add state to track the displayed image index within the combined array

  // Context hooks
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isProductInWishlist = product ? isInWishlist(product.id) : false;
  const placeholderImage = '/placeholder.png';

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.trim() === '') return false;

    try {
      if (url.startsWith('/')) return true;
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Fix the helper function to get the currently selected image
  const getSelectedImage = () => {
    if (!product || !product.images || product.images.length === 0) {
      return placeholderImage;
    }
    return product.images[selectedImageIndex] || placeholderImage;
  };

  // Helper function to get color name from color object or URL
  const getColorName = (color: string | null): string | null => {
    if (!color) return null;

    // If it's a URL, extract a simple name
    if (color.startsWith('http') || color.startsWith('/')) {
      // Get just the filename without extension
      const parts = color.split('/');
      const fileName = parts[parts.length - 1];
      return fileName.split('.')[0];
    }

    return color;
  };

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products?id=${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();

        // Extract and process gallery and additional images
        const mainImages = data.product.gallery?.map((item: any) => item.src) || [];
        const colorAdditionalImages = data.product.gallery?.map((item: any) =>
          (item.additionalImages || []).map((img: any) => img.src)
        ) || [];

        // Format data for our components
        const formattedProduct = {
          id: data.product._id,
          name: data.product.productName,
          price: data.product.regularPrice,
          // Include discounted price if it exists
          ...(data.product.discountedPrice && { discountedPrice: data.product.discountedPrice }),
          description: data.product.description || 'No description available',
          images: mainImages.filter((src: string) => src && src.trim() !== ''),
          additionalImagesByColor: colorAdditionalImages, // Store all additional images by color index
          details: [
            `Category: ${data.product.category}`,
            `Sub-Category: ${data.product.subCategory}`,
          ].filter(Boolean),
          colors: data.product.gallery?.map((item: any) => item.color) || [],
          sizes: data.product.sizes || [],
          rating: 0, // Initialize with 0
          occasions: data.product.occasions || [],
          style: data.product.style || [],
          season: data.product.season || [],
          category: data.product.category, // Make sure category is passed for accessory check
          sizeChartImage: data.product.sizeChartImage, // Include size chart image
        };

        // Set the initial additional images based on the first color
        if (formattedProduct.additionalImagesByColor?.[0]) {
          setCurrentAdditionalImages(formattedProduct.additionalImagesByColor[0]);
        }

        // Track this product view
        trackProductView({
          id: data.product._id,
          name: data.product.productName,
          category: data.product.category,
          subCategory: data.product.subCategory,
          colors: data.product.gallery?.map((item: any) => item.color) || [],
          sizes: data.product.sizes || [],
          price: data.product.regularPrice
        });

        // Store raw data for API interactions
        setProduct({
          ...formattedProduct,
          rawData: data.product
        });

        // Store recently viewed products in localStorage
        storeRecentlyViewed(formattedProduct);

        // Fetch related products based on category
        fetchRelatedProducts(data.product.category);

        // Fetch recently viewed products
        fetchRecentlyViewed();

      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  // Improved store recently viewed function
  const storeRecentlyViewed = (product: any) => {
    try {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

      // Format the product to match what ProductCard expects
      const formattedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images && product.images.length > 0 ?
          product.images[0] : placeholderImage,  // Use first image or placeholder
        colors: product.images || [],  // Use images array as colors
        sizes: product.sizes || [],
      };

      // Add to beginning of array, remove duplicates, limit to 6 items
      const updatedRecentlyViewed = [
        formattedProduct,
        ...recentlyViewed.filter((p: any) => p.id !== product.id)
      ].slice(0, 6);

      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
    } catch (error) {
      console.error('Error storing recently viewed products:', error);
    }
  };

  // Improved fetch recently viewed function
  const fetchRecentlyViewed = () => {
    try {
      const recentItems = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

      // Validate and fix image URLs in recently viewed items
      const validatedItems = recentItems
        .filter((p: any) => p.id !== id)
        .map((item: any) => ({
          ...item,
          image: isValidImageUrl(item.image) ? item.image : placeholderImage,
          colors: Array.isArray(item.colors) ?
            item.colors.filter(isValidImageUrl) : []
        }));

      setRecentlyViewed(validatedItems);
    } catch (error) {
      console.error('Error retrieving recently viewed products:', error);
    }
  };

  // Fetch related products
  const fetchRelatedProducts = async (category: string) => {
    try {
      const response = await fetch(`/api/customer/products?category=${category}&limit=6`);

      if (!response.ok) {
        throw new Error('Failed to fetch related products');
      }

      const data = await response.json();
      setRelatedProducts(data.products.filter((p: any) => p.id !== id).slice(0, 4));

    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };

  // Handle quantity changes
  const updateQuantity = (value: number) => {
    setQuantity(Math.max(1, quantity + value));
  };

  // Fixed debounced add to cart function
  const debouncedAddToCart = debounce((productData: any) => {
    const selectedImg = getSelectedImage();
    
    console.log("Adding to cart with:", {
      id: productData.id,
      name: productData.name,
      price: productData.price,
      discountedPrice: productData.discountedPrice, // Log discounted price
      selectedSize,
      selectedColor,
      image: selectedImg,
      quantity
    });

    // Ensure we're passing all required data including discountedPrice
    addToCart({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      discountedPrice: productData.discountedPrice, // Add discounted price here
      image: selectedImg,
      quantity: quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined
    });

    // Use notification service
    cartNotifications.itemAdded(productData.name);
  }, 300);

  // Fixed toggle wishlist handler
  const debouncedToggleWishlist = debounce((productId: string, isInList: boolean) => {
    console.log("Toggling wishlist for product ID:", productId, "Currently in wishlist:", isInList);
    
    if (isInList) {
      removeFromWishlist(productId);
      wishlistNotifications.itemRemoved();
    } else {
      addToWishlist(productId);
      wishlistNotifications.itemAdded();
    }
  }, 300);

  // Fixed add to cart handler
  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error("Please select a size");
      return;
    }

    // Pass the entire product object with correct ID and discountedPrice
    debouncedAddToCart({
      id: product.id, 
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice, // Add discounted price here
    });

    // Track this action for preferences
    trackProductAction(product, 'cart');
  };

  // Fixed toggle wishlist handler
  const toggleWishlist = () => {
    if (!product || !product.id) return;

    // Track wishlist action
    trackProductAction(product, 'wishlist');
    
    // Use product.id consistently, not product._id
    debouncedToggleWishlist(product.id, isProductInWishlist);
  };

  // Updated handler to handle color selection and update additional images
  const handleImageSelect = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedImageIndex(index);
    setDisplayedImageIndex(0); // Reset displayed image to main image when color changes

    // Update selected color
    if (product?.colors && product.colors[index]) {
      setSelectedColor(product.colors[index]);
    }

    // Update additional images for this color
    if (product?.additionalImagesByColor && product.additionalImagesByColor[index]) {
      setCurrentAdditionalImages(product.additionalImagesByColor[index]);
    } else {
      setCurrentAdditionalImages([]);
    }
  };

  // New handler for clicking on thumbnails
  const handleThumbnailClick = (index: number) => {
    setDisplayedImageIndex(index);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Custom pulse animation with grayscale colors only */}
          <style jsx global>{`
            .custom-pulse {
              animation: customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes customPulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}</style>
          <div className="custom-pulse grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column - Product Gallery Skeleton */}
            <div className="space-y-4">
              <div className="h-96 w-full bg-gray-200 rounded-lg"></div>
              <div className="flex space-x-2 overflow-x-auto py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 w-20 flex-shrink-0 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Product Info Skeleton */}
            <div className="space-y-6">
              <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-px w-full bg-gray-200"></div>
              <div className="space-y-3">
                <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-gray-200"></div>
                  ))}
                </div>
                <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-12 rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="h-12 w-full bg-gray-800 rounded-md opacity-70"></div>
                <div className="h-12 w-12 border border-gray-300 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-slate-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-700">Product Not Available</h1>
          <p className="mt-4 text-center text-slate-600 max-w-md">{error || "We couldn't find the product you're looking for. It may have been removed or is temporarily unavailable."}</p>
          <button 
            onClick={() => router.back()}
            className="mt-8 px-6 py-3 bg-black text-white rounded-md hover:bg-slate-800 transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <span className="hover:underline cursor-pointer" onClick={() => router.push('/')}>Home</span> &gt; 
          <span className="mx-1 hover:underline cursor-pointer" onClick={() => router.push(`/${product.rawData.category.toLowerCase()}`)}>{product.rawData.category}</span> &gt;
          <span className="font-medium"> {product.name}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Product Gallery with updated props */}
          <div className="product-container relative z-10">
            <ProductImageGallery 
              images={product?.images || []} 
              additionalImages={currentAdditionalImages}
              selectedImage={selectedImageIndex}
              onImageSelect={handleImageSelect}
              onThumbnailClick={handleThumbnailClick} // Add the new handler
            />
          </div>
          
          {/* Right Column - Product Information */}
          <div>
            <ProductInformation 
              product={{
                ...product,
                rating: productRating > 0 ? productRating : 0,
              }}
              quantity={quantity} 
              updateQuantity={updateQuantity}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              onImageSelect={handleImageSelect}
            />
            
            {/* Action Buttons with improved props and debugging */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <ShoppingBag size={18} className="mr-2" />
                Add to Cart
              </button>
              
              <button 
                onClick={toggleWishlist}
                className={`flex items-center justify-center py-3 px-6 rounded-md border transition-colors ${
                  isProductInWishlist 
                    ? 'bg-red-50 text-red-500 border-red-200' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Heart 
                  size={18} 
                  className="mr-2" 
                  fill={isProductInWishlist ? "currentColor" : "none"} 
                />
                {isProductInWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>
          </div>
        </div>
        
        {/* User Reviews Section */}
        <UserReviewsSection 
          productId={product.id} 
          onRatingChange={(newRating: number) => {
            setProductRating(newRating);
          }}
        />
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-100 py-12">
          <div className="max-w-6xl mx-auto">
            <ProductCarousel title="YOU MIGHT ALSO LIKE" products={relatedProducts} />
          </div>
        </div>
      )}
      
      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="py-12 max-w-6xl mx-auto">
          <ProductCarousel title="RECENTLY VIEWED" products={recentlyViewed} />
        </div>
      )}

      <Footer />
    </div>
  );
}
