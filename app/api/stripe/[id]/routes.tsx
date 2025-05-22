import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export default async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const { customerId } = params;

  if (!customerId || typeof customerId !== "string") {
    return NextResponse.json({
      error: "Missing or invalid customerId parameter",
      status: 400,
    });
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });

    return NextResponse.json({
      customer,
      paymentMethods: paymentMethods.data,
      payments: payments.data,
      status: 200,
    });
  } catch (error: any) {
    console.error("Error fetching Stripe customer data:", error);
    return NextResponse.json({
      error: error.message,
      status: 500,
    });
  }
}
