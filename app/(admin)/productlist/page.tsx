"use client";
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminProductCart from '../../components/AdminProductCard';
import TopBar from '../../components/TopBar';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Products</h1>
            <button 
              onClick={() => router.push('/productcreate')} 
              className="bg-orange-500 text-white px-4 py-2 rounded-lg"
            >
              Add New Product
            </button>
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
              <p className="text-gray-500">No products found. Create your first product!</p>
              <button 
                onClick={() => router.push('/productcreate')} 
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
              >
                Add New Product
              </button>
            </div>
          )}

          {/* Product Grid - Always 3 columns */}
          {!loading && !error && formattedProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formattedProducts.map((product) => (
                <AdminProductCart key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination - Only show if there are products */}
          {!loading && !error && formattedProducts.length > 0 && (
            <footer className="mt-6 flex justify-center">
              <button className="bg-gray-300 px-3 py-1 rounded-md mr-2">Previous</button>
              <button className="bg-gray-300 px-3 py-1 rounded-md">Next</button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

