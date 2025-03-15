"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCarousel from "../../components/ProductCarousel";
import ProductImageGallery from "../../components/ProductImageGallery";
import ProductInformation from "../../components/ProductInformation";
import ProductDetailsSection from "../../components/ProductDetailsSection";
import UserReviewsSection from "../../components/UserReviewsSection";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { toast } from "react-hot-toast";
import { Heart, ShoppingBag } from "lucide-react";
import { cartNotifications, wishlistNotifications } from "@/lib/notificationService";

// Add debounce utility
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
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

  // Helper function to get the currently selected image
  const getSelectedImage = () => {
    return product?.images && product.images.length > 0
      ? product.images[selectedImageIndex]
      : placeholderImage;
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
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        
        // Format data for our components with image validation
        const formattedProduct = {
          id: data.product._id,
          name: data.product.productName,
          price: data.product.regularPrice,
          description: data.product.description || 'No description available',
          images: data.product.gallery
            ?.map((item: any) => item.src)
            .filter((src: string) => src && src.trim() !== '') || [], // Filter out empty strings
          details: [
            `Category: ${data.product.category}`,
            `Sub-Category: ${data.product.subCategory}`,
            data.product.description ? `Description: ${data.product.description}` : null,
          ].filter(Boolean),
          colors: data.product.gallery?.map((item: any) => item.color) || [],
          sizes: data.product.sizes || [],
          rating: 0, // Initialize with 0, will be updated with real rating from reviews
        };
        
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
  
  // Use debounce for cart and wishlist actions
  const debouncedAddToCart = debounce((productData: any) => {
    const selectedImg = getSelectedImage();
    const colorName = getColorName(selectedColor);
    
    console.log("Adding to cart with:", {
      selectedSize,
      selectedColor,
      colorName,
      selectedImage: selectedImg
    });
    
    addToCart({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      image: selectedImg,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor // Store the original color identifier
    }, false); // Pass false to prevent duplicate notification
    
    // Use notification service
    cartNotifications.itemAdded(productData.name);
  }, 300);

  const debouncedToggleWishlist = debounce((productId: string, isInWishlist: boolean) => {
    if (isInWishlist) {
      removeFromWishlist(productId);
      // Use notification service
      wishlistNotifications.itemRemoved();
    } else {
      addToWishlist(productId);
      // Use notification service
      wishlistNotifications.itemAdded();
    }
  }, 300);
  
  // Add to cart handler with quantity support
  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize && product.sizes.length > 0) {
      toast.error("Please select a size");
      return;
    }
    
    // No need to define selectedImage here anymore, using helper function instead
    debouncedAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
    });
  };
  
  // Toggle wishlist handler
  const toggleWishlist = () => {
    if (!product) return;
    debouncedToggleWishlist(product._id, isProductInWishlist);
  };
  
  // Sync the selectedImageIndex state with ProductInformation and ProductImageGallery
  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
    // Also update selected color based on the selected image
    if (product?.colors && product.colors[index]) {
      setSelectedColor(product.images[index]);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-40 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 w-64 bg-gray-200 rounded-md"></div>
            <div className="mt-8 h-4 w-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-red-500">Error Loading Product</h1>
          <p className="mt-4">{error || "Product not found"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-8 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
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
          {/* Left Column - Product Gallery */}
          <div className="product-container relative z-10">
            <ProductImageGallery 
              images={product.images} 
              selectedImage={selectedImageIndex}
              onImageSelect={handleImageSelect}
            />
          </div>
          
          {/* Right Column - Product Information */}
          <div>
            <ProductInformation 
              product={{
                ...product,
                rating: productRating > 0 ? productRating : 0, // Use the real rating if available, otherwise 0
              }}
              quantity={quantity} 
              updateQuantity={updateQuantity}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              onImageSelect={handleImageSelect} // Pass the handler for image selection
            />
            
            {/* Action Buttons */}
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
        
        {/* Product Details Section */}
        <ProductDetailsSection details={product.details} />
        
        {/* User Reviews Section - Pass onRatingChange callback */}
        <UserReviewsSection 
          productId={product.id} 
          onRatingChange={(newRating) => {
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
