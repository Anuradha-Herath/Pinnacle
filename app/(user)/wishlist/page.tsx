"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWishlist } from "../../context/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { Search, User, Heart, ShoppingBag, ChevronDown } from "react-feather";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import Header from "../../components/Header";
import { requestCache } from "@/lib/requestCache";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  colors: string[];
  sizes: string[];
}

const WishlistPage = () => {
  const { wishlist } = useWishlist();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedIds, setLastFetchedIds] = useState<string>(''); // Track last fetched IDs
  const [isFetching, setIsFetching] = useState(false); // Prevent concurrent fetches

  // Fetch products when wishlist changes
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      // Filter out any null/undefined/empty values before making API call
      const validWishlistIds = wishlist.filter(id => id && typeof id === 'string' && id.trim());
      const idsString = validWishlistIds.join(',');
      
      // Skip fetch if no valid IDs or if the IDs haven't changed or already fetching
      if (validWishlistIds.length === 0) {
        setWishlistProducts([]);
        setLastFetchedIds('');
        return;
      }

      // Only fetch if the IDs have actually changed and not currently fetching
      if (idsString === lastFetchedIds || isFetching) {
        return;
      }

      try {
        setIsFetching(true);
        setLoading(true);
        
        // Check cache first
        const cacheKey = `wishlist_products_${idsString}`;
        const cachedData = requestCache.get(cacheKey);
        
        if (cachedData) {
          setWishlistProducts(cachedData.products);
          setLastFetchedIds(idsString);
          setLoading(false);
          setIsFetching(false);
          return;
        }
        
        const response = await fetch(`/api/customer/wishlist?ids=${idsString}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch wishlist products');
        }
        
        const data = await response.json();
        
        // Cache the response for 2 minutes
        requestCache.set(cacheKey, data, 120000);
        
        setWishlistProducts(data.products);
        setLastFetchedIds(idsString);
      } catch (err) {
        console.error('Error fetching wishlist products:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, lastFetchedIds, isFetching]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <p>Loading your wishlist items...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Items added to your wishlist will be saved here</p>
            <Link 
              href="/"
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-medium mb-3">Recently added</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {wishlistProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  hideWishlist={false}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default WishlistPage;
