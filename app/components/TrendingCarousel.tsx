"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiscounts } from "../context/DiscountContext";
import { fetchTrendingProducts } from "@/lib/apiUtils";

/**
 * Specialized carousel for trending products with optimized loading
 */
const TrendingCarousel = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const lastScrollPosRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Use discount context for bulk fetching
  const { fetchBulkDiscounts } = useDiscounts();

  // Fetch trending products as soon as component mounts
  useEffect(() => {
    mountedRef.current = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      try {
        // Start with a timeout to show skeleton for at least 300ms
        // This prevents layout shifts and flickering if data loads too quickly
        timeoutId = setTimeout(() => {
          if (!mountedRef.current) return;
          
          // Show skeleton loading state for a minimum time
          // even if data loads quickly, to prevent layout shifts
          setLoading(true);
        }, 0);

        // Fetch trending products with the optimized function
        const data = await fetchTrendingProducts();
        
        if (!mountedRef.current) return;
        
        if (data.products && data.products.length > 0) {
          // Apply any product transformations or filtering here if needed
          setProducts(data.products);
          
          // Pre-fetch discounts for all products at once for better performance
          const productIds = data.products
            .map((product: any) => product.id)
            .filter((id: string) => id);
            
          if (productIds.length > 0) {
            // Only fetch if products don't already have discount info
            const needsDiscountFetch = data.products.some((product: any) => 
              product.discountedPrice === undefined && !product.discount
            );
            
            if (needsDiscountFetch) {
              console.log(`Pre-fetching bulk discounts for ${productIds.length} trending products`);
              fetchBulkDiscounts(productIds);
            }
          }
        } else {
          // Handle empty data case
          setProducts([]);
        }
      } catch (err) {
        console.error("Error loading trending products:", err);
        setError(err instanceof Error ? err.message : "Failed to load trending products");
        setProducts([]);
      } finally {
        // Ensure loading spinner shows for at least 300ms to prevent layout shifts
        if (timeoutId) clearTimeout(timeoutId);
        
        // Delay hiding loading state slightly to prevent flickering
        setTimeout(() => {
          if (mountedRef.current) {
            setLoading(false);
          }
        }, 300);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchBulkDiscounts]);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth > 1536) setCardsPerView(4);
      else if (window.innerWidth > 1280) setCardsPerView(3);
      else if (window.innerWidth > 1024) setCardsPerView(2);
      else if (window.innerWidth > 768) setCardsPerView(1);
      else setCardsPerView(1);
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);

    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      const viewportWidth = carouselRef.current.clientWidth;
      const scrollWidth = carouselRef.current.scrollWidth;
      const maxScrollable = Math.max(0, scrollWidth - viewportWidth);
      setMaxScroll(maxScrollable);
    }
  }, [products, cardsPerView]);

  useEffect(() => {
    if (carouselRef.current && products.length > 0) {
      const groups = Math.ceil(products.length / cardsPerView);
      const pixelsPerDot = maxScroll / (groups - 1 || 1);
      const newIndex = Math.round(scrollPosition / pixelsPerDot);
      setVisibleIndex(Math.min(newIndex, Math.max(0, groups - 1)));
    }
  }, [scrollPosition, maxScroll, products.length, cardsPerView]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!carouselRef.current) return;

      const newPosition = carouselRef.current.scrollLeft;

      if (Math.abs(newPosition - lastScrollPosRef.current) > 2) {
        lastScrollPosRef.current = newPosition;
        setScrollPosition(newPosition);
      }

      animationFrameRef.current = null;
    });
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current || products.length === 0) return;

    const cardWidth = carouselRef.current.scrollWidth / products.length;
    const currentIndex = Math.round(scrollPosition / cardWidth);

    let targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    targetIndex = Math.max(0, Math.min(targetIndex, products.length - 1));

    const newPosition = targetIndex * cardWidth;

    isProgrammaticScrollRef.current = true;

    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    lastScrollPosRef.current = newPosition;
    setScrollPosition(newPosition);

    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  };

  const scrollToDot = (index: number) => {
    if (carouselRef.current && products.length > 0) {
      const groups = Math.ceil(products.length / cardsPerView);
      let newPosition = (maxScroll / (groups - 1 || 1)) * index;

      newPosition = Math.min(newPosition, maxScroll);

      isProgrammaticScrollRef.current = true;

      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });

      lastScrollPosRef.current = newPosition;
      setScrollPosition(newPosition);

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  };

  const getDotCount = () => {
    if (products.length <= cardsPerView) return 1;
    return Math.ceil(products.length / cardsPerView);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render loading skeletons with simplified version for better performance
  const renderSkeletons = () => {
    return (
      <div 
        className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pt-2"
        style={{ scrollbarWidth: "none" }}
      >
        {[...Array(4)].map((_, i) => (
          <ProductCardSkeleton key={i} simplified={true} />
        ))}
      </div>
    );
  };

  // Show error state when there's an error
  if (error && !loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 my-8">
        <h2 className="text-2xl font-bold mb-6">Trending Products</h2>
        <div className="text-center py-8 text-red-500">
          Failed to load trending products. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 my-8">
      <h2 className="text-2xl font-bold mb-6">Trending Products</h2>

      {loading ? (
        renderSkeletons()
      ) : products.length > 0 ? (
        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 
              bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 
              transition-opacity duration-300 disabled:opacity-0 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-primary-500`}
            disabled={scrollPosition <= 0}
            aria-label="Previous products"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pt-2 scroll-smooth"
            style={{ scrollbarWidth: "none" }}
            onScroll={handleScroll}
          >
            {products.map((product, index) => (
              <ProductCard key={`trending-${product.id}-${index}`} product={product} />
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 
              bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 
              transition-opacity duration-300 disabled:opacity-0 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-primary-500`}
            disabled={scrollPosition >= maxScroll}
            aria-label="Next products"
          >
            <ChevronRight size={24} />
          </button>

          {getDotCount() > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {Array.from({ length: getDotCount() }).map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full focus:outline-none 
                    ${i === visibleIndex ? "bg-primary-500 w-4" : "bg-gray-300"}
                    transition-all duration-300`}
                  onClick={() => scrollToDot(i)}
                  aria-label={`Go to product group ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No trending products available at the moment.
        </div>
      )}
    </div>
  );
};

export default TrendingCarousel;
