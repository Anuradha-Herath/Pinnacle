"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import TopBar from "../../../components/TopBar";
import AdminProductCart from "../../../components/AdminProductCard";
import { PencilIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/solid";

interface Category {
  _id: string;
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  mainCategory: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  productName: string;
  description: string;
  regularPrice: number;
  category: string; // Main category
  subCategory: string; // This matches with category.title
  gallery: Array<{src: string}>;
}

export default function CategoryDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/categories/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch category");
        }
        
        const data = await response.json();
        setCategory(data.category);
        
        // After getting the category, fetch related products
        fetchProductsByCategory(data.category);
        
      } catch (error) {
        console.error("Error fetching category:", error);
        setError(error instanceof Error ? error.message : "Failed to load category");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCategory();
    }
  }, [id]);
  
  // Fetch products by category
  const fetchProductsByCategory = async (categoryData: Category) => {
    try {
      setProductsLoading(true);
      // We'll use the category title as the subcategory in products
      const response = await fetch(`/api/products?subCategory=${encodeURIComponent(categoryData.title)}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductsError(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };
  
  // Handle product deletion
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      
      // Remove the deleted product from the list
      setProducts(products.filter(product => product._id !== productId));
      
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  // Transform database products to the format expected by AdminProductCart
  const formattedProducts = products.map(product => ({
    id: product._id,
    name: product.productName,
    image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : '/placeholder.png',
    price: product.regularPrice,
    sales: 0,  // Default since we don't have sales data in the current structure
    remaining: 100  // Default since we don't have inventory data in the current structure
  }));

  // Loading states
  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Category Details" />
          <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !category) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="min-h-screen bg-gray-50 flex-1">
          <TopBar title="Category Details" />
          <div className="p-6">
            <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p>{error || "Category not found"}</p>
              <button 
                onClick={() => router.push('/admin/categorylist')} 
                className="mt-4 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                Back to Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="min-h-screen bg-gray-50 flex-1">
        <TopBar title="Category Details" />
        
        <div className="p-6">
          {/* Breadcrumb Navigation */}
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/admin/categorylist" className="text-gray-600 font-medium hover:text-orange-500">
              Categories
            </Link>{" "}
            &gt;{" "}
            <span className="text-orange-500 font-medium">{category.title}</span>
          </div>

          {/* Category Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{category.title}</h1>
            <button
              onClick={() => router.push(`/admin/categoryedit/${category._id}`)}
              className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <PencilIcon className="h-5 w-5 mr-1" /> Edit
            </button>
          </div>

          {/* Category Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Thumbnail */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Thumbnail</h2>
              <div className="flex justify-center">
                <img
                  src={category.thumbnailImage || "/placeholder.png"}
                  alt={category.title}
                  className="max-h-48 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
              <h2 className="text-lg font-semibold mb-4">Information</h2>
              <div className="space-y-4">
                {/* Main Category */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Main Category</h3>
                  <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    category.mainCategory === 'Men' 
                      ? 'bg-blue-100 text-blue-800' 
                      : category.mainCategory === 'Women' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {category.mainCategory}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Title</h3>
                  <p className="mt-1">{category.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{category.description || "No description provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price Range</h3>
                  <p className="mt-1">{category.priceRange || "Not specified"}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
              <h2 className="text-lg font-semibold mb-4">Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1">
                    {new Date(category.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1">
                    {new Date(category.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Products in this Category</h2>
              <Link 
                href={`/admin/productcreate?category=${category?.mainCategory}&subcategory=${category?.title}`} 
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add New Product
              </Link>
            </div>

            {/* Products Loading State */}
            {productsLoading && (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            )}

            {/* Products Error State */}
            {!productsLoading && productsError && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                <p>{productsError}</p>
              </div>
            )}

            {/* No Products State */}
            {!productsLoading && !productsError && products.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500 mb-4">No products found in this category.</p>
                <Link 
                  href={`/admin/productcreate?category=${category.mainCategory}&subcategory=${category.title}`} 
                  className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add First Product
                </Link>
              </div>
            )}

            {/* Updated Products Grid that matches productlist page */}
            {!productsLoading && !productsError && products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {formattedProducts.map((product) => (
                  <AdminProductCart 
                    key={product.id} 
                    product={product} 
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination - if needed */}
            {products.length > 0 && (
              <div className="mt-8 flex justify-center">
                {/* Pagination controls can be added here if needed */}
              </div>
            )}
          </div>

          {/* Back button */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => router.push("/admin/categorylist")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
