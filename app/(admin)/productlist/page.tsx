"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminProductCart from '../../components/AdminProductCard';
import TopBar from '../../components/TopBar';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface Product {
  _id: string;
  productName: string;
  gallery: { src: string; color: string; name: string }[];
  regularPrice: number;
  sales?: number;  // Optional as it might not exist in newly created products
  remaining?: number; // Optional as it might not exist in newly created products
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

  const fetchProducts = async (page = 1, query = searchQuery) => {
    try {
      setLoading(true);
      // Include the search query in the API call if it exists
      const queryParam = query ? `&q=${encodeURIComponent(query)}` : '';
      const response = await fetch(`/api/products?page=${page}&limit=${itemsPerPage}${queryParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, itemsPerPage]);

  // Handle product deletion and refresh list
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
                onClick={() => router.push('/productcreate')} 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                Add New Product
              </button>
            </div>
            
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex w-full max-w-md">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <button 
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-r-md hover:bg-orange-600"
              >
                Search
              </button>
            </form>
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
                  onClick={() => router.push('/productcreate')} 
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
                >
                  Add New Product
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchProducts(1, '');
                  }}
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

