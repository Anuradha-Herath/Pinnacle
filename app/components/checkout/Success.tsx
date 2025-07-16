"use client";

import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useRouter } from "next/navigation";

type SuccessProps = {
  orderNumber: string;
};

const Success = ({ orderNumber }: SuccessProps) => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-2 sm:px-4 bg-gray-50">
        <section className="w-full max-w-md p-4 sm:p-6 bg-white rounded-lg shadow-md text-center flex flex-col items-center">
          <div className="mb-4 animate-bounce">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="#dcfce7"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4-4" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-600 mb-2">
            Payment Successful!
          </h1>
          <p className="text-base sm:text-lg text-gray-700 mb-4">
            Thank you for your purchase.
          </p>
          <div className="mb-6">
            <span className="text-gray-600">Your order number is</span>
            <span className="block text-xl sm:text-2xl font-mono font-bold text-gray-900 mt-1 break-all">
              {orderNumber}
            </span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-4 py-2 w-full sm:w-auto bg-black text-white rounded-md hover:bg-gray-900"
          >
            Go to Homepage
          </button>
          <button
            onClick={() => router.push("/profilepage")}
            className="mt-3 text-sm text-gray-600 hover:underline"
          >
            View My Orders
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Success;
