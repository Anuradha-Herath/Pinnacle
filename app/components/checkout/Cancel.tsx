import React from 'react'
import Header from '../Header'
import Footer from '../Footer'
import { useRouter } from 'next/navigation';

const Cancel = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-2 sm:px-4 bg-gray-50">
        <section
          className="w-full max-w-md p-4 sm:p-6 bg-white rounded-lg shadow-md text-center flex flex-col items-center"
          aria-labelledby="cancel-title"
        >
          {/* Sad/Warning Icon */}
          <div className="mb-4 animate-pulse">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fee2e2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5" />
            </svg>
          </div>
          <h1
            id="cancel-title"
            className="text-2xl sm:text-3xl font-extrabold text-red-600 mb-2"
          >
            Payment Canceled
          </h1>
          <p className="text-base sm:text-lg text-gray-700 mb-4">
            Your payment was not completed. If this was a mistake, you can try again or return to the homepage.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-4 py-2 w-full sm:w-auto bg-black text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition"
            aria-label="Go to Homepage"
          >
            Go to Homepage
          </button>
          <button
            onClick={() => router.push("/cart")}
            className="mt-3 text-sm text-gray-600 hover:underline focus:outline-none"
            aria-label="Return to Cart"
          >
            Return to Cart
          </button>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default Cancel
