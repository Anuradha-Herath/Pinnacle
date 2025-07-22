"use client";

import { useSearchParams } from "next/navigation";
import Success from "@/app/components/checkout/Success";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("order") || "N/A";

  return <Success orderNumber={orderNumber} />;
}
