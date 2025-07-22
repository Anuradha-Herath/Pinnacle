"use client";

import React, { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useRouter } from "next/navigation";

type SuccessProps = {
  orderNumber: string;
};

interface PointsData {
  pointsEarned: number;
  totalPoints: number;
  orderTotal: number;
}

const Success = ({ orderNumber }: SuccessProps) => {
  const router = useRouter();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(true);

  useEffect(() => {
    const fetchPointsData = async () => {
      try {
        const response = await fetch(
          `/api/orders/points?orderNumber=${orderNumber}`
        );
        const data = await response.json();

        if (data.success) {
          setPointsData({
            pointsEarned: data.pointsEarned,
            totalPoints: data.totalPoints,
            orderTotal: data.orderTotal,
          });
        } else {
          console.error("Failed to fetch points data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching points data:", error);
      } finally {
        setLoadingPoints(false);
      }
    };

    if (orderNumber && orderNumber !== "N/A") {
      fetchPointsData();
    } else {
      setLoadingPoints(false);
    }
  }, [orderNumber]);

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2l4-4"
              />
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

          {/* Points Information */}
          {loadingPoints ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          ) : pointsData ? (
            <div className="mb-6 w-full bg-gradient-to-b from-gray-100 to-white-800 rounded-xl border shadow-sm px-6 py-5 relative overflow-hidden text-black">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-black mr-2">🎉</span>
                <h3 className="text-lg font-semibold text-black">
                  You've earned points!
                </h3>
              </div>
              <div className="flex flex-col gap-2 sm:gap-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-black flex items-center gap-2">
                    <span>Order points</span>
                  </span>
                  <span className="text-xl font-extrabold text-black tracking-wide flex items-center gap-1">
                    {pointsData.pointsEarned}
                    <span className="ml-1 text-base text-black">pts</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-black flex items-center gap-2">
                    <span>Total points</span>
                  </span>
                  <span className="text-lg font-bold text-black flex items-center gap-1">
                    {pointsData.totalPoints}
                    <span className="ml-1 text-xs text-black">pts</span>
                  </span>
                </div>
              </div>
              <div className="text-xs text-center text-black pt-2">
                You earned <b>{pointsData.pointsEarned}</b> points for
                your&nbsp;
                <b>${pointsData.orderTotal.toFixed(2)}</b> purchase.
              </div>
            </div>
          ) : (
            <div className="mb-6 w-full bg-gradient-to-r from-gray-100 to-white-800 border rounded-lg px-4 py-6 flex flex-col items-center">
              <p className="text-sm text-black text-center">
                Points information not available for this order.
              </p>
            </div>
          )}

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
