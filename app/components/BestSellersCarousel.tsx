"use client";

import React, { useState, useEffect } from "react";
import ProductCarousel from "./ProductCarousel";
import { fetchBestSellers } from "@/lib/apiUtils";

interface BestSellersCarouselProps {
  category: 'Men' | 'Women'; // Only Men or Women, no null
  loading?: boolean;
  title?: string; // Optional title override
}

const BestSellersCarousel = ({ category, loading: externalLoading = false, title }: BestSellersCarouselProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBestSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoryLabel = category;
        console.log(`Fetching best sellers for ${categoryLabel}`);
        
        const data = await fetchBestSellers({
          category: category,
          limit: 10
        });
        
        if (data && data.products) {
          setProducts(data.products);
          console.log(`Loaded ${data.products.length} best-selling ${categoryLabel} products`);
        } else {
          console.warn(`No best sellers data returned for ${categoryLabel}`);
          setProducts([]);
        }
      } catch (err) {
        console.error(`Error fetching best sellers for ${category}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load best sellers');
        setProducts([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadBestSellers();
  }, [category]);

  // Show error message if there's an error
  if (error) {
    return (
      <div className="px-4 md:px-8 lg:px-12 my-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load best sellers for {category}. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <ProductCarousel
      title={title || ""} // Use provided title or empty string
      products={products}
      loading={loading || externalLoading}
      carouselId={`bestsellers-${category}`} // Unique ID for best sellers
    />
  );
};

export default BestSellersCarousel;
