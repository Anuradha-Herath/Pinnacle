import React from 'react'
import Image from 'next/image';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  image: string;
  name: string;
  price: number;
  sales: number;
  remaining: number;
}

const AdminProductCard = ({ product }: { product: Product }) => {
    // Calculate percentage for the progress bar with a safety check
    const total = product.sales + product.remaining;
    const remainingPercentage = total > 0 ? (product.remaining / total) * 100 : 0;
    
    return (
        <div className="bg-white shadow-lg rounded-2xl p-4 relative">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="bg-orange-500 text-white p-2 rounded-full"><Eye size={16} /></button>
        <button className="bg-orange-500 text-white p-2 rounded-full"><Pencil size={16} /></button>
        <button className="bg-orange-500 text-white p-2 rounded-full"><Trash2 size={16} /></button>
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
      <div className="text-center mt-3">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-800 font-bold">${product.price.toFixed(2)}</p>
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
