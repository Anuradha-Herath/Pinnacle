import React, { useRef } from "react";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  products,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto mt-6">
      <h2 className="text-white text-xl font-semibold mb-3">{title}</h2>

      {/* Left Arrow */}
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full z-10 hover:bg-opacity-80"
        onClick={() => scroll(-300)}
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>

      {/* Scrollable Product Row */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex space-x-4 overflow-x-scroll overflow-y-hidden scrollbar-hide scroll-smooth "
          ref={scrollRef}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full z-10 hover:bg-opacity-80"
        onClick={() => scroll(300)}
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>
    </div>
  );
};

export default ProductCarousel;
