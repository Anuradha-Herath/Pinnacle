"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

const PaymentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'canceled' | 'processing'>('processing');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const { clearCart } = useCart();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const order = searchParams.get('order');
    
    if (success === '1') {
      setStatus('success');
      if (order) setOrderNumber(order);
      // Clear the cart on successful payment
      clearCart();
    } else if (canceled === '1') {
      setStatus('canceled');
    } else {
      setStatus('processing');
    }
  }, [searchParams, clearCart]);

  return (
    <>
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={64} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
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
          )}

          {status === 'canceled' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle size={64} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Payment Canceled</h1>
              <p className="text-gray-600 mb-6">
                Your payment was canceled. If you encountered any issues, please try again or contact our customer support.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Link href="/checkout" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center justify-center">
                  Return to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/" className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
              <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
              <p className="text-gray-600 mb-6">
                Please wait while we process your payment...
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentPage;
