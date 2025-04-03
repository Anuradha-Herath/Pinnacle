"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useSearchHistory } from "../hooks/useSearchHistory";

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
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
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
        {!loading && !error && products.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg">No products found matching &quot;{query}&quot;</p>
            <p className="mt-2 text-gray-600">
              Try checking your spelling or using different keywords.
            </p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 bg-black text-white rounded-md">
              Continue Shopping
            </Link>
          </div>
        )}
        
        {/* Results grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-4 text-gray-600">{products.length} product(s) found</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
