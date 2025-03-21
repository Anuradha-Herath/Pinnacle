"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  title: string;
  products: any[];
  loading?: boolean;
}

const ProductCarousel = ({ title, products, loading = false }: ProductCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  // Add a ref to track the last scroll position to prevent redundant updates
  const lastScrollPosRef = useRef(0);
  // Add throttling timer ref
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate how many cards should be visible and maximum scroll position
  useEffect(() => {
    const updateCardsPerView = () => {
      // Rough estimate based on screen width
      if (window.innerWidth > 1536) setCardsPerView(5);
      else if (window.innerWidth > 1280) setCardsPerView(4);
      else if (window.innerWidth > 1024) setCardsPerView(3);
      else if (window.innerWidth > 768) setCardsPerView(2);
      else setCardsPerView(1);
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);

    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Calculate max scroll and update values when products or viewport changes
  useEffect(() => {
    if (carouselRef.current) {
      const viewportWidth = carouselRef.current.clientWidth;
      const scrollWidth = carouselRef.current.scrollWidth;
      const maxScrollable = Math.max(0, scrollWidth - viewportWidth);
      setMaxScroll(maxScrollable);
    }
  }, [products, cardsPerView]);

  // Update visible index when scroll position changes
  // This is now a separate effect to avoid re-calculating maxScroll on every scroll
  useEffect(() => {
    if (carouselRef.current && products.length > 0) {
      // Number of slideable groups (rounding up)
      const groups = Math.ceil(products.length / cardsPerView);
      // Calculate how many pixels each dot represents
      const pixelsPerDot = maxScroll / (groups - 1 || 1);
      
      // Set visible index based on current scroll position
      const newIndex = Math.round(scrollPosition / pixelsPerDot);
      setVisibleIndex(Math.min(newIndex, Math.max(0, groups - 1)));
    }
  }, [scrollPosition, maxScroll, products.length, cardsPerView]);

  // Memoized scroll handler with throttling to prevent excessive updates
  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current) return; // Skip if already waiting on a timer
    
    scrollTimerRef.current = setTimeout(() => {
      if (carouselRef.current) {
        const newPosition = carouselRef.current.scrollLeft;
        
        // Only update state if the position actually changed significantly
        if (Math.abs(newPosition - lastScrollPosRef.current) > 5) {
          lastScrollPosRef.current = newPosition;
          setScrollPosition(newPosition);
        }
      }
      scrollTimerRef.current = null;
    }, 50); // Throttle to max 20 updates per second
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.scrollWidth / Math.max(1, products.length);
      const scrollAmount = cardWidth * cardsPerView;
      
      let newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(maxScroll, scrollPosition + scrollAmount);
      
      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      // Update the last scroll position ref directly
      lastScrollPosRef.current = newPosition;
      setScrollPosition(newPosition);
    }
  };

  const scrollToDot = (index: number) => {
    if (carouselRef.current && products.length > 0) {
      // Number of slideable groups
      const groups = Math.ceil(products.length / cardsPerView);
      // Calculate position based on dot index
      let newPosition = (maxScroll / (groups - 1 || 1)) * index;
      
      // Ensure we don't scroll past the end
      newPosition = Math.min(newPosition, maxScroll);
      
      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      // Update the last scroll position ref directly
      lastScrollPosRef.current = newPosition;
      setScrollPosition(newPosition);
    }
  };

  // Calculate the number of dots needed
  const getDotCount = () => {
    if (products.length <= cardsPerView) return 1;
    return Math.ceil(products.length / cardsPerView);
  };

  // Cleanup effect for the scroll timer
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="px-4 md:px-8 lg:px-12 my-8">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="relative">
          {/* Left Navigation Arrow */}
          {scrollPosition > 0 && (
            <button 
              className="absolute left-0 z-10 top-1/2 -translate-y-1/2 -translate-x-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => scroll('left')}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          {/* Product Carousel */}
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 pb-8 scroll-smooth hide-scrollbar"
            onScroll={handleScroll}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-none">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          
          {/* Right Navigation Arrow */}
          {scrollPosition < maxScroll && maxScroll > 0 && (
            <button 
              className="absolute right-0 z-10 top-1/2 -translate-y-1/2 translate-x-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={24} />
            </button>
          )}
          
          {/* Pagination Dots */}
          {products.length > cardsPerView && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: getDotCount() }).map((_, index) => (
                <button 
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === visibleIndex 
                      ? 'w-6 bg-orange-500' 
                      : 'w-2 bg-gray-500 hover:bg-gray-400'
                  }`}
                  onClick={() => scrollToDot(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white">
          No products found.
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
