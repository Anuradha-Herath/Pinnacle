"use client";
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminProductCart from '../../components/AdminProductCard';
import AdminProductListSkeleton from '../../components/AdminProductListSkeleton';
import TopBar from '../../components/TopBar';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

import { deduplicateRequest, invalidateProductCaches } from '@/lib/apiUtils';

interface Product {
  _id: string;
  productName: string;
  gallery: { src: string; color: string; name: string }[];
  regularPrice: number;
  discountedPrice?: number; // Add discounted price field
  sales?: number;  // Optional as it might not exist in newly created products
  remaining?: number; // Optional as it might not exist in newly created products
}

interface SearchSuggestion {
  id: string;
  name: string;
  image: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Show 9 products per page (3x3 grid)
  const [totalPages, setTotalPages] = useState(1);
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [navigating, setNavigating] = useState(false); // Add navigation loading state
  const router = useRouter();
const [filter, setFilter] = useState('All'); // Add state for filter
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async (page = 1, query = searchQuery, category = filter, forceFresh = false) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Include the search query in the API call if it exists
      const queryParam = query ? `&q=${encodeURIComponent(query)}` : '';
      const categoryParam = category && category !== 'All' ? `&category=${encodeURIComponent(category)}` : '';
      // Add cache busting parameter if forced fresh or if coming from product creation
      const cacheBustParam = forceFresh || window.location.search.includes('_t=') ? `&_t=${Date.now()}` : '';
      const url = `/api/products?page=${page}&limit=${itemsPerPage}${queryParam}${categoryParam}${cacheBustParam}`;
      
      // Add timeout for faster failure detection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Use deduplicated request to prevent duplicate API calls, but bypass cache if forced fresh
        const data: any = forceFresh 
          ? await fetch(url, { 
              cache: 'no-store',
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              }
            }).then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              return res.json();
            })
          : await deduplicateRequest(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        if (data.success) {
          setProducts(data.products || []);
          setTotalPages(data.pagination?.pages || 1);
        } else {
          throw new Error(data.error || 'Failed to fetch products');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're coming from product creation/edit (cache bust parameter)
    const shouldForceFresh = window.location.search.includes('_t=');
    fetchProducts(currentPage, searchQuery, filter, shouldForceFresh);
    
    // Clean up the URL if we had cache bust parameter
    if (shouldForceFresh) {
      const url = new URL(window.location.href);
      url.searchParams.delete('_t');
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentPage, itemsPerPage]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const url = `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`;
          const data: any = await deduplicateRequest(url);
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Debounce the search to prevent too many API calls
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleProductDelete = (deletedProductId: string) => {
    // Remove the deleted product from the state
    setProducts(products.filter(product => product._id !== deletedProductId));
    
    // If this was the last item on the page and not the first page, go back one page
    if (products.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else {
      // Otherwise just refresh the current page with forced fresh data
      fetchProducts(currentPage, searchQuery, filter, true);
    }
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchProducts(1, searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    fetchProducts(1, suggestion);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If search input is cleared, fetch all products
    if (newValue === '') {
      setCurrentPage(1);
      fetchProducts(1, '');
    }
  };

  // Clear search and show all products
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchProducts(1, '');
    setShowSuggestions(false);
  };

  // Handle pagination navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Transform database products to the format expected by AdminProductCard
  const formattedProducts = products.map(product => ({
    id: product._id,
    name: product.productName,
    image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : '/placeholder.png',
    price: product.regularPrice,
discountedPrice: product.discountedPrice, // Pass discounted price if it exists
    sales: product.sales || 0,  // Default to 0 if sales doesn't exist
    remaining: product.remaining || 100  // Default to 100 if remaining doesn't exist
  }));

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* TopBar - Positioned inside main content, not overlapping sidebar */}
        <TopBar title='Product List' />

        <div className="p-6">
          <header className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">All Products</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    invalidateProductCaches();
                    fetchProducts(currentPage, searchQuery, filter, true);
                  }} 
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  onClick={() => {
                    setNavigating(true);
                    router.push('/admin/productcreate');
                  }} 
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  disabled={navigating}
                >
                  {navigating ? 'Loading...' : 'Add New Product'}
                </button>
              </div>
            </div>
            
            {/* Search bar with suggestions */}
            <div ref={searchRef} className="relative w-full max-w-md">
              
              
              {/* Search Suggestions with Images */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleSuggestionClick(suggestion.name)}
                    >
                      {/* Product Image */}
                      <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={suggestion.image} 
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.png';
                          }}
                        />
                      </div>
                      {/* Product Name */}
                      <div className="flex-grow">
                        <span className="text-sm">{suggestion.name}</span>
                      </div>
                      {/* Search Icon */}
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
{/* Main Category Filter */}
            <div className="flex items-center mt-4 md:mt-0 w-full justify-between">
              <div className="relative w-full max-w-md">
              {/* Search bar remains on the left */}
              <form onSubmit={handleSearch} className="flex w-full">
                <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="w-full pl-10 pr-10 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {searchQuery && (
                  <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  </button>
                )}
                </div>
                <button 
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-r-md hover:bg-orange-600"
                >
                Search
                </button>
              </form>
              </div>

              {/* Dropdown filter moved to the right */}
              <div className="relative ml-4">
              <select
                value={filter}
                onChange={(e) => {
                const selectedFilter = e.target.value;
                setFilter(selectedFilter);
                fetchProducts(1, searchQuery, selectedFilter);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All">All Products</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Accessories">Accessories</option>
              </select>
              </div>
            </div>
          </header>



          {/* Loading State - Show skeleton instead of simple loading text */}
          {loading && <AdminProductListSkeleton />}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 font-semibold mb-2">Error Loading Products</div>
              <div className="text-red-500 mb-4">{error}</div>
              <button 
                onClick={() => fetchProducts(currentPage, searchQuery, filter, true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && formattedProducts.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-600 font-semibold mb-2">No Products Found</div>
              <div className="text-gray-500 mb-4">
                {searchQuery ? `No products found matching "${searchQuery}"` : "No products found. Create your first product!"}
              </div>
              {!searchQuery && (
                <button 
                  onClick={() => {
                    setNavigating(true);
                    router.push('/admin/productcreate');
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  disabled={navigating}
                >
                  {navigating ? 'Loading...' : 'Add New Product'}
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Product Grid - Always 3 columns */}
          {!loading && !error && formattedProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formattedProducts.map((product) => (
                <AdminProductCart 
                  key={product.id} 
                  product={product} 
                  onDelete={handleProductDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination - Only show if there are products */}
          {!loading && !error && formattedProducts.length > 0 && (
            <footer className="mt-6">
              <div className="flex justify-center items-center gap-2">
                <button 
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1 ? 'bg-orange-200 text-gray-700 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="mx-2 text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages ? 'bg-orange-200 text-gray-700 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

