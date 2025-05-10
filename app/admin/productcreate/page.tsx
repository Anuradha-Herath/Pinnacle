"use client";
import { useEffect, useState } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import ProductForm from "@/app/components/product/ProductForm";

export default function ProductCreate() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen relative">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-20">
        <TopBar title="Product Create" />
        <div className="p-6 mx-auto w-full max-w-6xl">
          <div className="text-sm text-gray-500 mb-6">
            <span>Home</span> &gt; <span>All Products</span> &gt;
            <span className="font-semibold"> Add New Product</span>
          </div>
          <h1 className="text-2xl font-bold mb-8">Add New Product</h1>
          
          <ProductForm />
        </div>
      </div>
    </div>
  );
}
