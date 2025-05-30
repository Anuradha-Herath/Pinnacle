//"use client"
import React from 'react'
import Header from '../Header';
import Footer from '../Footer';
import { useRouter } from 'next/navigation';

type SuccessProps = {
  orderNumber: string;
}

const Success = ({ orderNumber }: SuccessProps) => {
    const router = useRouter();
    return (
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <div className="m-3 flex items-center justify-center bg-gray-50">
              <div className="p-6 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-green-600 mb-4">Success!</h1>
                <p className="text-lg text-gray-700">
                  Payment successful! Your order number is {orderNumber}.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-6 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
            <Footer />
          </div>
        );
}

export default Success;
