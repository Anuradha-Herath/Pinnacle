import Order from "@/models/Order"; // Import from Order.ts instead of Order.tsx
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authenticateUser } from "@/middleware/auth";

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

// Define the structure used for line items in Stripe and order storage
interface LineItem {
  quantity: number;
  price_data: {
    currency: string;
    product_data: string;
    unit_amount: number;
  };
  metadata: {
    productId: string;
    color: string;
    size: string;
    imageUrl: string;
  };
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

export async function POST(request: NextRequest) {
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
      ...new Set(requestBody.cart.map((item: CartItem) => item.id)),
    ];
    console.log("Unique product IDs:", uniqueProductIds);

    // Modified Step 5: Format line items with simplified structure for database compatibility
    const simpleLineItems = requestBody.cart.map((item: CartItem): LineItem => {
      const productName = item.name;
      const productDetails = [];

      if (item.color) {
        let colorName = item.color;
        if (colorName.startsWith("http") || colorName.includes("/")) {
          const parts = colorName.split("/");
          const fileName = parts[parts.length - 1];
          colorName = fileName.split(".")[0];
        }
        productDetails.push(`Color: ${colorName}`);
      }

      if (item.size) {
        productDetails.push(`Size: ${item.size}`);
      }

      const fullProductName =
        productDetails.length > 0
          ? `${productName} (${productDetails.join(", ")})`
          : productName;

      const imageUrl = item.image || "";

      return {
        quantity: item.quantity,
        price_data: {
          currency: "USD",
          product_data: fullProductName,
          unit_amount: Math.round(item.price * 100),
        },
        metadata: {
          productId: item.id,
          color: item.color || "N/A",
          size: item.size || "N/A",
          imageUrl: imageUrl,
        },
      };
    });

    console.log(
      "Created simplified line items compatible with the database schema"
    );

    // Step 6: Create a simplified order object to store
    try {
      console.log("Creating order object");

      const authResult = await authenticateUser(request);
      let userId = null;

      if (authResult.authenticated && authResult.user) {      
        console.log(
          "User is authenticated, linking order to user account:",
          authResult.user.id
        );
        userId = authResult.user.id;
      } else {
        console.log("Guest checkout - no user account associated");
      }

      const orderItems = requestBody.cart.map((item: CartItem) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || "",
        size: item.size || undefined,
        color: item.color || undefined,
        metadata: {
          additionalInfo: "",
          customizations: "",
        },
      }));

      const pointsEarned = Math.round(requestBody.total * 0.1);

      // Updated order data structure to match schema requirements
      const orderData = {
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        customer: {
          email: requestBody.email,
          firstName: requestBody.firstName,
          lastName: requestBody.lastName,
          phone: requestBody.phone,
          marketingConsent: requestBody.emailOffers || false,
        },
        paymentMethod: "card",
        orderItems: orderItems,
        shippingAddress: {
          fullName: `${requestBody.firstName} ${requestBody.lastName}`,
          address: requestBody.address || "Pickup in store",
          city: requestBody.city || "N/A",
          postalCode: requestBody.postalCode || "00000",
          country: requestBody.country || "N/A",
          phone: requestBody.phone,
        },
        // Add the required amount object with proper fields
        amount: {
          subtotal: requestBody.subtotal,
          shippingCost: requestBody.shippingCost,
          total: requestBody.total
        },
        // Use the correct enum value for shipping.deliveryMethod
        shipping: {
          deliveryMethod: requestBody.deliveryMethod === "ship" ? "shipping" : "pickup"
        },
        // Keep these fields for backward compatibility
        deliveryMethod: requestBody.deliveryMethod === "ship" ? "shipping" : "pickup",
        itemsPrice: requestBody.subtotal,
        shippingPrice: requestBody.shippingCost,
        taxPrice: 0,
        totalPrice: requestBody.total,
        status: "Processing",
        paymentStatus: "pending",
        pointsEarned: pointsEarned,
      };

      console.log("Order data prepared for saving");

      // Step 7: Create a new order document
      try {
        console.log("Checking MongoDB connection");
        if (mongoose.connection.readyState !== 1) {
          console.log("MongoDB not connected, connecting now...");
          if (!process.env.MONGODB_URI) {
            console.error("MONGODB_URI environment variable is not set");
            return NextResponse.json(
              { error: "Database configuration error" },
              { status: 500 }
            );
          }

          try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB successfully");
          } catch (connError) {
            console.error("Failed to connect to MongoDB:", connError);
            return NextResponse.json(
              { error: "Database connection failed" },
              { status: 500 }
            );
          }
        } else {
          console.log("MongoDB already connected");
        }

        console.log(
          "Creating new Order instance with data:",
          JSON.stringify(orderData, null, 2)
        );
        const newOrder = new Order(orderData);

        console.log("Saving order to database...");
        try {
          await newOrder.save();
          console.log("Order saved successfully with ID:", newOrder._id);
        } catch (saveError: any) {
          console.error("Error saving order:", saveError);
          console.error("Error details:", saveError.message);

          return NextResponse.json(
            {
              error: "Failed to save order",
              details: saveError.message,
              validationErrors: saveError.errors
                ? Object.keys(saveError.errors).map((key) => ({
                    field: key,
                    message: saveError.errors[key].message,
                  }))
                : [],
            },
            { status: 500 }
          );
        }

        if (userId) {
          try {
            console.log(
              `Adding ${pointsEarned} reward points to user ${userId}'s account`
            );

            const updatedUser = await User.findOneAndUpdate(
              { _id: userId },
              { $inc: { points: pointsEarned } },
              { new: true }
            );

            if (updatedUser) {
              console.log(
                `User points updated successfully. New total: ${updatedUser.points}`
              );
            } else {
              console.error("Failed to update user points: User not found");
            }
          } catch (pointsError) {
            console.error("Error updating user points:", pointsError);
          }
        }

        let redirectUrl = "/payment";

        if (stripe) {
          try {
            console.log("Creating Stripe checkout session");

            // Format line items for Stripe API requirements
            const stripeLineItems = simpleLineItems.map((item: LineItem) => ({
              price_data: {
                currency: "USD",
                product_data: {
                  name: item.price_data.product_data,
                  images: [item.metadata.imageUrl].filter(Boolean),
                },
                unit_amount: item.price_data.unit_amount,
              },
              quantity: item.quantity,
            }));

            console.log(
              "Stripe line items:",
              JSON.stringify(stripeLineItems, null, 2)
            );

            try {
              const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: stripeLineItems,
                mode: "payment",
                success_url: `${
                  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
                }/payment?success=1&order=${newOrder._id}`,
                cancel_url: `${
                  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
                }/payment?canceled=1`,
                metadata: { orderId: newOrder._id.toString() },
              });
              
              console.log("metadata:", session.metadata);
              console.log("Stripe session created:", session.id);

              redirectUrl = session.url;
            } catch (stripeError) {
              console.error("Stripe session creation failed:", stripeError);
              // Fall back to default payment page if Stripe fails
              redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment?success=1&order=${newOrder._id}`;
            }
          } catch (stripeError) {
            console.error("Stripe session creation failed:", stripeError);
            // Fall back to default payment page if Stripe fails
            redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment?success=1&order=${newOrder._id}`;
          }
        } else {
          console.log("Skipping Stripe - not initialized");
          // Set redirect to payment page with success parameter
          redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment?success=1&order=${newOrder._id}`;
        }

        // When sending to the client, include images in the response
        const clientLineItems = simpleLineItems.map((item: LineItem) => ({
          quantity: item.quantity,
          price_data: {
            currency: item.price_data.currency,
            product_data: {
              name: item.price_data.product_data,
              images: [item.metadata.imageUrl].filter(Boolean),
            },
            unit_amount: item.price_data.unit_amount,
          },
          metadata: item.metadata,
        }));

        return NextResponse.json({
          success: true,
          orderId: newOrder.orderNumber || newOrder._id.toString(),
          line_items: clientLineItems,
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
