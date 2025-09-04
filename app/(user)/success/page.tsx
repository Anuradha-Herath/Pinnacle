"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Success from "@/app/components/checkout/Success";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("order") || "N/A";

  return <Success orderNumber={orderNumber} />;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-300 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
