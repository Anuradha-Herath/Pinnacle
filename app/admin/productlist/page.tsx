"use client";
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminProductCart from '../../components/AdminProductCard';
import TopBar from '../../components/TopBar';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

import { deduplicateRequest } from '@/lib/apiUtils';

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
  const router = useRouter();
  const [filter, setFilter] = useState('All'); // Add state for filter
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Add a ref to track if a request is in progress to prevent multiple simultaneous calls
  const requestInProgress = useRef(false);
  const lastPageChangeTime = useRef(0);

  const fetchProducts = async (page = 1, query = searchQuery, category = filter) => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      console.log(`Skipping duplicate request for page ${page}`);
      return;
    }
    
    try {
      requestInProgress.current = true;
      setLoading(true);
      // Include the search query in the API call if it exists
      const queryParam = query ? `&q=${encodeURIComponent(query)}` : '';
      const categoryParam = category && category !== 'All' ? `&category=${encodeURIComponent(category)}` : '';
      const url = `/api/products?page=${page}&limit=${itemsPerPage}${queryParam}${categoryParam}`;
      
      console.log(`Fetching products for page ${page} with URL: ${url}`);
      
      // Use deduplicated request to prevent duplicate API calls
      const data: any = await deduplicateRequest(url);
      
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  };

  useEffect(() => {
    // Only fetch if the page is valid and no request is in progress
    if (currentPage > 0 && !requestInProgress.current) {
      fetchProducts(currentPage);
    }
  }, [currentPage]);

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
      // Otherwise just refresh the current page
      fetchProducts(currentPage, searchQuery);
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
    
    // Only fetch if search input is completely cleared
    // For other cases, let the search suggestions handle it or wait for form submission
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
    const now = Date.now();
    if (currentPage > 1 && !requestInProgress.current && (now - lastPageChangeTime.current) > 300) {
      lastPageChangeTime.current = now;
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const now = Date.now();
    if (currentPage < totalPages && !requestInProgress.current && (now - lastPageChangeTime.current) > 300) {
      lastPageChangeTime.current = now;
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
              <button 
                onClick={() => router.push('/admin/productcreate')} 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Add New Product
              </button>
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



          {/* Loading state */}
          {loading && (
            <div className="text-center py-10">
              <p>Loading products...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-10">
              <p className="text-red-500">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && formattedProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">
                {searchQuery ? `No products found matching "${searchQuery}"` : "No products found. Create your first product!"}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => router.push('/admin/productcreate')} 
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
                >
                  Add New Product
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

