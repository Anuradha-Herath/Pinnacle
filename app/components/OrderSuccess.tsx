"use client";

import React, { useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface OrderSuccessProps {
  orderNumber: string | null;
  onClose: () => void;
}

export default function OrderSuccess({ orderNumber, onClose }: OrderSuccessProps) {
  // Use a ref to track if we've rendered
  const hasRendered = useRef(false);

  // Only log on first render
  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      console.log("OrderSuccess mounted with order:", orderNumber);
    }
  }, [orderNumber]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Order Complete!</h2>
          
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been received and is now being processed.
          </p>
          
          {orderNumber && (
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-gray-700">
                Order Number: <span className="font-semibold">{orderNumber}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Order number
              </p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 w-full"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
