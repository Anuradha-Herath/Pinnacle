"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { useSearchHistory } from "../../hooks/useSearchHistory";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  colors: string[];
  sizes: string[];
  category?: string;
  subCategory?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { addToHistory } = useSearchHistory();
  
  // Add a ref to track if we've already added this search term to history
  const searchAdded = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const ITEMS_PER_PAGE = 12;

  // Lazy loading observer
  const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const loadMoreProducts = async () => {
    if (!query || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=${ITEMS_PER_PAGE}&offset=${page * ITEMS_PER_PAGE}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch more products');
      }
      
      const data = await response.json();
      const newProducts = data.products;
      
      if (newProducts.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
      
      setProducts(prev => [...prev, ...newProducts]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      // Only add to history once per query and only if query exists
      if (query.trim() && !searchAdded.current) {
        addToHistory(query.trim());
        searchAdded.current = true;
      }
      
      try {
        setLoading(true);
        setError(null);
        setProducts([]);
        setPage(1);
        setHasMore(true);
        
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=${ITEMS_PER_PAGE}&offset=0`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        const newProducts = data.products;
        
        setProducts(newProducts);
        
        if (newProducts.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load search results');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
    
    // Reset the ref when query changes
    return () => {
      searchAdded.current = false;
    };
  }, [query, addToHistory]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Search Results</h1>
          {query && (
            <p className="text-gray-600 mt-2">Showing results for: &quot;{query}&quot;</p>
          )}
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12 min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Error state */}
        {!loading && error && (
          <div className="py-12 text-center min-h-[400px]">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* No results state */}
        {!loading && !error && products.length === 0 && (
          <div className="py-12 text-center min-h-[400px]">
            <p className="text-lg">No products found matching &quot;{query}&quot;</p>
            <p className="mt-2 text-gray-600">
              Try checking your spelling or using different keywords.
            </p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        )}
        
        {/* Results grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-4 text-gray-600">{products.length}+ product(s) found</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 auto-rows-auto">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  ref={index === products.length - 1 ? lastProductElementRef : null}
                  className="flex justify-center"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-gray-600">Loading more products...</span>
              </div>
            )}
            
            {/* No more products indicator */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">You&apos;ve seen all products for this search.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
