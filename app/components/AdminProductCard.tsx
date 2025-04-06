import React from 'react'
import Image from 'next/image';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  image: string;
  name: string;
  price: number;
  discountedPrice?: number;
  sales: number;
  remaining: number;
}

const AdminProductCard = ({ product, onDelete }: { 
  product: Product;
  onDelete?: (id: string) => void;  // Optional callback to refresh products list
}) => {
  const router = useRouter();
  
    // Calculate percentage for the progress bar with a safety check
    const total = product.sales + product.remaining;
    const remainingPercentage = total > 0 ? (product.remaining / total) * 100 : 0;
    
    // Navigate to edit page with product ID
    const handleEditClick = () => {
      router.push(`/admin/productedit/${product.id}`);
    };
    
    // Navigate to view details page with product ID
    const handleViewClick = () => {
      router.push(`/admin/productdetails/${product.id}`);
    };
  // Calculate discount percentage if discounted price exists
  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice < product.price;
  const discountPercentage = hasDiscount ? 
    Math.round(((product.price - product.discountedPrice!) / product.price) * 100) : 0;
  

    // Handle product deletion
    const handleDeleteClick = async () => {
      // Show confirmation dialog
      if (confirm(`Are you sure you want to delete ${product.name}?`)) {
        try {
          // Make API call to delete the product
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete product');
          }
          
          alert('Product deleted successfully');
          
          // Refresh the product list if onDelete callback is provided
          if (onDelete) {
            onDelete(product.id);
      } else {
            // Otherwise, just refresh the page
            window.location.reload();
      }
    } catch (error) {
          console.error('Error deleting product:', error);
          alert(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
  };

  return (
        <div className="bg-white shadow-lg rounded-2xl p-4 relative">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button 
          onClick={handleViewClick}
          className="bg-orange-500 text-white p-2 rounded-full"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={handleEditClick}
          className="bg-orange-500 text-white p-2 rounded-full"
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={handleDeleteClick}
          className="bg-orange-500 text-white p-2 rounded-full"
        >
          <Trash2 size={16} />
        </button>
       

      </div>

      {/* Product Image */}
      <div className="flex justify-center">
        <Image 
          src={product.image || '/placeholder.png'} 
            alt={product.name}
          width={150} 
          height={150} 
          className="rounded-md object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = '/placeholder.png';
          }}
        />
        </div>

      {/* Product Info */}
      {/*<div className="text-center mt-3">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-800 font-bold">${product.price.toFixed(2)}</p>
      </div>*/}
        {/* Product Name */}
        <Link href={`/admin/productedit/${product.id}`}>
          <h3 className="text-md font-medium text-gray-900 hover:text-black mb-1 truncate">{product.name}</h3>
        </Link>
        
        {/* Product Price - updated to show both prices */}
        <div className="mb-4">
          {hasDiscount ? (
            <div className="flex items-center space-x-2">
              <span className="text-md font-semibold text-red-600">${product.discountedPrice?.toFixed(2)}</span>
              <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-md font-semibold">${product.price.toFixed(2)}</span>
          )}
          {/* Discount Badge */}
 {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
 

      {/* Sales & Remaining Products */}
      <div className="mt-4 bg-gray-100 p-3 rounded-lg">
        <div className="flex justify-between text-sm font-semibold">
          <span>Sales</span>
          <span className="text-red-500 flex items-center">⬆ {product.sales}</span>
        </div>

        <div className="flex justify-between text-sm font-semibold mt-3">
          <span>Remaining Products</span>
          <span className="text-gray-500">{product.remaining}</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
          <div 
            className="bg-orange-500 h-2 rounded-full" 
            style={{ width: `${remainingPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default AdminProductCard;
