import { NextResponse } from "next/server";
import Order from "@/models/Order";
import User from "@/models/User";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import connectDB from "@/lib/db";
import { processLoyaltyPoints } from "@/utils/loyaltyPoints";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  await connectDB();

  // Get the raw body for signature verification
  console.log("Webhook received");
  const text = await request.text();
  const sig = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // Construct and verify the event
    event = stripe.webhooks.constructEvent(text, sig, endpointSecret!);
    // console.log("Webhook verified:", event.type);
  } catch (err: any) {
    return new NextResponse("invalid signature", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Handle Stripe checkout completion
  if (event.type === "checkout.session.completed") {
    const updatedOrder = await Order.findByIdAndUpdate(
      session.metadata?.orderId,
      {
        status: "Paid",
        paymentStatus: "paid",
        stripeSessionId: session.id,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (updatedOrder) {
      const userId = updatedOrder.userId;

      // Clear the user's cart after successful payment
      if (userId) {
        const clearedUser = await User.findByIdAndUpdate(
          userId,
          { $set: { cart: [] } },
          { new: true }
        );

        if (clearedUser) {
          console.log(`Cart cleared for user ${clearedUser._id}`);
        }
      }

      // Add loyalty points if orderNumber exists
      if (updatedOrder.orderNumber) {
        try {
          await processLoyaltyPoints(updatedOrder.orderNumber);
          console.log("Loyalty points processed");
        } catch (err) {
          console.error("Failed to process loyalty points:", err);
        }
      }
    }
  }

  return new NextResponse("ok", { status: 200 });
}
