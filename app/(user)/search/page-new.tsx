"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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

// Loading fallback component
function SearchLoadingFallback() {
  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-2">Loading search...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Component that uses useSearchParams
function SearchContent() {
  // Safely handle searchParams
  let query = "";
  try {
    const searchParams = useSearchParams();
    query = searchParams.get("q") || "";
  } catch (err) {
    console.error("Error accessing search params:", err);
    // Fall back to client-side URL parsing if needed
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      query = urlParams.get("q") || "";
    }
  }
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToHistory } = useSearchHistory();
  
  // Add a ref to track if we've already added this search term to history
  const searchAdded = useRef(false);

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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }
        
        const data = await response.json();
        setProducts(data.products);
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
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Search Results</h1>
          {query && (
            <p className="text-gray-600 mt-2">Showing results for: &quot;{query}&quot;</p>
          )}
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Error state */}
        {!loading && error && (
          <div className="py-12 text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-black text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* No results state */}
        {!loading && !error && products.length === 0 && query && (
          <div className="py-12 text-center">
            <p className="text-lg">No products found matching &quot;{query}&quot;</p>
            <p className="mt-2 text-gray-600">
              Try adjusting your search or browse our categories
            </p>
            <Link 
              href="/category"
              className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-md"
            >
              Browse Categories
            </Link>
          </div>
        )}
        
        {/* Results grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {/* Pagination could go here if needed */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-12 flex justify-center">
            <p className="text-gray-600">{products.length} products found</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// Main wrapper component with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <SearchContent />
    </Suspense>
  );
}
