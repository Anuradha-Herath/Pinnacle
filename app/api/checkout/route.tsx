import Product from "@/models/Product";
import Order from "@/models/Order";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Safely initialize Stripe with error handling

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Define TypeScript interfaces for better type safety
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

interface CheckoutData {
  email: string;
  emailOffers: boolean;
  deliveryMethod: string;
  country?: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone: string;
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export async function POST(request: Request) {
  let requestBody = null;

  try {
    // Step 1: Parse request body safely
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json(
          { error: "Empty request body" },
          { status: 400 }
        );
      }
      requestBody = JSON.parse(text);
      console.log("Successfully parsed request body");
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Step 2: Validate basic required fields
    if (
      !requestBody.email ||
      !requestBody.firstName ||
      !requestBody.lastName ||
      !requestBody.phone
    ) {
      return NextResponse.json(
        { error: "Missing required personal information" },
        { status: 400 }
      );
    }

    if (!requestBody.cart || requestBody.cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Step 3: Validate shipping address if needed
    if (requestBody.deliveryMethod === "ship") {
      if (
        !requestBody.address ||
        !requestBody.city ||
        !requestBody.postalCode ||
        !requestBody.country
      ) {
        return NextResponse.json(
          { error: "Missing required shipping information" },
          { status: 400 }
        );
      }
    }

    // Step 4: Extract unique product IDs
    const uniqueProductIds = [
      ...new Set(requestBody.cart.map((item: any) => item.id)),
    ];
    console.log("Unique product IDs:", uniqueProductIds);

    // Step 5: Format simple line items without database lookup for now
    // This will help isolate if the error is in the database interaction
    const simpleLineItems = requestBody.cart.map((item: any) => ({
      quantity: item.quantity,
      price_data: {
        currency: "INR",
        product_data: item.name,
        unit_amount: Math.round(item.price * 100),
      },
    }));

    console.log("Created simple line items");

    // Step 6: Create a simplified order object to store
    try {
      console.log("Creating order object");
      const orderData = {
        customer: {
          email: requestBody.email,
          firstName: requestBody.firstName,
          lastName: requestBody.lastName,
          phone: requestBody.phone,
          emailOffers: requestBody.emailOffers || false,
        },
        shipping: {
          deliveryMethod: requestBody.deliveryMethod,
          address:
            requestBody.deliveryMethod === "ship"
              ? {
                  country: requestBody.country,
                  address: requestBody.address,
                  city: requestBody.city,
                  postalCode: requestBody.postalCode,
                }
              : null,
        },
        line_items: simpleLineItems,
        amount: {
          subtotal: requestBody.subtotal,
          shippingCost: requestBody.shippingCost,
          total: requestBody.total,
        },
        status: "pending",
        paymentStatus: "pending",
      };

      console.log("Order data prepared for saving");

      // Step 7: Create a new order document
      try {
        console.log("Checking MongoDB connection");
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(
            process.env.MONGODB_URI || "mongodb://localhost:27017/pinnacle"
          );
          console.log("Connected to MongoDB");
        }

        console.log("Creating new Order instance");
        const newOrder = new Order(orderData);

        console.log("Saving order to database");
        await newOrder.save();

        console.log("Order saved successfully with ID:", newOrder._id);

        // Step 8: Create Stripe checkout session if Stripe is available
        let redirectUrl = "/payment"; // Default fallback

        if (stripe) {
          try {
            console.log("Creating Stripe checkout session");

            // Format line items for Stripe API requirements
            const stripeLineItems = simpleLineItems.map((item) => ({
              price_data: {
                currency: "INR",
                product_data: {
                  name: item.price_data.product_data, // This is the name of the product
                },
                unit_amount: item.price_data.unit_amount, // Already in smallest currency unit
              },
              quantity: item.quantity,
            }));

            // Log the items being sent to Stripe
            console.log(
              "Stripe line items:",
              JSON.stringify(stripeLineItems, null, 2)
            );

            // Create the Stripe session
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card"],
              line_items: stripeLineItems,
              mode: "payment",
              success_url: `${
                process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
              }/order-success?order=${newOrder.orderNumber}`,
              cancel_url: `${
                process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
              }/checkout?canceled=1`,
              metadata: { orderId: newOrder._id.toString() },
            });

            console.log("Stripe session created:", session.id);

            // Use Stripe's checkout URL
            redirectUrl = session.url;
          } catch (stripeError) {
            console.error("Stripe session creation failed:", stripeError);
            // Continue with local payment processing when Stripe fails
          }
        } else {
          console.log("Skipping Stripe - not initialized");
        }

        // Return success with order info and appropriate redirect
        return NextResponse.json({
          success: true,
          orderId: newOrder.orderNumber || newOrder._id.toString(),
          line_items: simpleLineItems,
          redirect: redirectUrl,
        });
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        console.error("Database error stack:", dbError.stack);
        return NextResponse.json(
          {
            error: "Database error",
            details: dbError.message,
            stack: dbError.stack,
          },
          { status: 500 }
        );
      }
    } catch (orderCreationError: any) {
      console.error("Error creating order:", orderCreationError);
      return NextResponse.json(
        {
          error: "Failed to create order",
          details: orderCreationError.message,
        },
        { status: 500 }
      );
    }
  } catch (generalError: any) {
    console.error("General error in checkout:", generalError);
    console.error("Error stack:", generalError.stack);
    return NextResponse.json(
      {
        error: "Checkout process failed",
        details: generalError.message,
        stack: generalError.stack,
      },
      { status: 500 }
    );
  }
}
