"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';

export default function OrderConfirmedPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const hasCleared = useRef(false); // Use a ref to track if cart has been cleared
  
  useEffect(() => {
    if (!hasCleared.current) {
      // Set the flag first to prevent multiple executions
      hasCleared.current = true;
      
      // Clear cart only once
      clearCart();
      
      // Set order number from route parameter
      setOrderNumber(params.id);
    }
  }, [clearCart, params.id]);

  return (
    <>
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your order has been received and is now being processed.
            </p>
            {orderNumber && (
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-gray-700">Order Number: <span className="font-semibold">{orderNumber}</span></p>
                <p className="text-sm text-gray-500 mt-1">
                  Order number
                </p>
              </div>
            )}
            <div className="flex justify-center mt-6">
              <Link href="/" className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center justify-center">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
