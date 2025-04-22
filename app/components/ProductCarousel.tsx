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
  const lastScrollPosRef = useRef(0);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

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

      if (carouselRef.current) {
        const finalPosition = carouselRef.current.scrollLeft;
        lastScrollPosRef.current = finalPosition;
        setScrollPosition(finalPosition);
      }
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

        if (carouselRef.current) {
          const finalPosition = carouselRef.current.scrollLeft;
          lastScrollPosRef.current = finalPosition;
          setScrollPosition(finalPosition);
        }
      }, 500);
    }
  };

  const getDotCount = () => {
    if (products.length <= cardsPerView) return 1;
    return Math.ceil(products.length / cardsPerView);
  };

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="px-4 md:px-8 lg:px-12 my-8">
      {title && (
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[black]"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="relative">
          {scrollPosition > 0 && (
            <button
              className="absolute left-0 z-10 top-1/2 -translate-y-1/2 -translate-x-6 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => scroll("left")}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-6 pb-8 scroll-smooth hide-scrollbar"
            onScroll={handleScroll}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-none">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {scrollPosition < maxScroll && maxScroll > 0 && (
            <button
              className="absolute right-0 z-10 top-1/2 -translate-y-1/2 translate-x-6 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => scroll("right")}
            >
              <ChevronRight size={24} />
            </button>
          )}

          {products.length > cardsPerView && (
            <div className="relative h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
              <div className="absolute inset-0 flex">
                {Array.from({ length: products.length }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-grow border-r border-gray-300 last:border-0"
                  />
                ))}
              </div>

              <div
                className="absolute top-0 left-0 h-full bg-[#1D1D1D] will-change-transform"
                style={{
                  width: "100%",
                  transform: `scaleX(${
                    maxScroll > 0 ? scrollPosition / maxScroll : 0
                  })`,
                  transformOrigin: "left",
                  transition: isProgrammaticScrollRef.current
                    ? "transform 0.4s ease-out"
                    : "none",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-70" />
              </div>

              <div
                className="absolute inset-0 cursor-pointer"
                onClick={(e) => {
                  if (!carouselRef.current || maxScroll <= 0) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;

                  const targetIndex = Math.floor(percentage * products.length);
                  const cardWidth =
                    carouselRef.current.scrollWidth / products.length;
                  const exactPosition = targetIndex * cardWidth;

                  isProgrammaticScrollRef.current = true;

                  carouselRef.current.scrollTo({
                    left: exactPosition,
                    behavior: "smooth",
                  });

                  lastScrollPosRef.current = exactPosition;
                  setScrollPosition(exactPosition);

                  setTimeout(() => {
                    isProgrammaticScrollRef.current = false;

                    if (carouselRef.current) {
                      const finalPosition = carouselRef.current.scrollLeft;
                      lastScrollPosRef.current = finalPosition;
                      setScrollPosition(finalPosition);
                    }
                  }, 500);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-800">No products found.</div>
      )}
    </div>
  );
};

export default ProductCarousel;

