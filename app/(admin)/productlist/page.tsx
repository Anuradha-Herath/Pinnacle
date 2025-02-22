"use client";
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import AdminProductCart from '../../components/AdminProductCard';
import TopBar from '../../components/TopBar';

const ProductsPage = () => {
  const [products, setProducts] = useState([
    { id: 1, name: "T-Shirt", image: "/p1.webp", price: 110.40, sales: 1269, remaining: 1269 },
    { id: 2, name: "Hoodie", image: "/p2.webp", price: 120.99, sales: 980, remaining: 520 },
    { id: 3, name: "Cap", image: "/cap1.webp", price: 50.00, sales: 500, remaining: 300 },
    { id: 4, name: "Backpack", image: "/p3.webp", price: 75.20, sales: 400, remaining: 200 },
    { id: 5, name: "T-Shirt", image: "/p4.webp", price: 110.40, sales: 1269, remaining: 1269 },
    { id: 6, name: "Hoodie", image: "/p5.webp", price: 120.99, sales: 980, remaining: 520 },
    { id: 7, name: "Cap", image: "/cap2.webp", price: 50.00, sales: 500, remaining: 300 },
    { id: 8, name: "Backpack", image: "/p6.webp", price: 75.20, sales: 500, remaining: 500 },
    { id: 9, name: "Hoodie", image: "/p2.webp", price: 120.99, sales: 980, remaining: 520 },
  ]);

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
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg">Add New Product</button>
          </header>

          {/* Product Grid - Always 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <AdminProductCart key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <footer className="mt-6 flex justify-center">
            <button className="bg-gray-300 px-3 py-1 rounded-md mr-2">Previous</button>
            <button className="bg-gray-300 px-3 py-1 rounded-md">Next</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

