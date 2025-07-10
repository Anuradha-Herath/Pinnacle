import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Order from "@/models/Order";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
};

export async function POST(request: Request) {
  await connectDB();

  // Get the raw body for signature verification
  console.log("Webhook received");
  const text = await request.text();
    console.log("Raw body:", text);
  const sig = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // Construct and verify the event
    event = stripe.webhooks.constructEvent(text, sig, endpointSecret!);
    console.log("Webhook verified:", event.type);
  } catch (err: any) {
    return new NextResponse( "invalid signature", { status: 400 } );
  }

  const session = event.data.object as Stripe.Checkout.Session;
  //console.log("Session", session);
  // Handle the event based on its type

  if (event.type === "checkout.session.completed"){
    console.log("Checkout session completed:");
    const orderpay = await Order.findByIdAndUpdate(session.metadata?.orderId, {
                    status: "Paid",
                    paymentStatus: "paid",
                    stripeSessionId: session.id,
                    updatedAt: new Date(),
                  });
    console.log("Order updated:", orderpay);                  
  }

  return new NextResponse("ok", { status: 200 });
}
