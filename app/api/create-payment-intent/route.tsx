import { NextRequest, NextResponse } from "next/server";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const { amount, customer, products } = await request.json();

    // Format product information for metadata
    const productsList =
      products
        ?.map(
          (item: any, index: number) =>
            `Item ${index + 1}: ${item.name} - $${item.price} x ${
              item.quantity
            } (${item.color}, ${item.size})`
        )
        .join("; ") || "No products";

    // Create customer if it doesn't already exist
    let stripeCustomer;
    try {
      // Try to find customer by email first
      const customers = await stripe.customers.list({
        email: customer.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];

        // Update customer information
        await stripe.customers.update(stripeCustomer.id, {
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          shipping: {
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone,
            address: {
              line1: customer.address,
              city: customer.city,
              postal_code: customer.postalCode,
              country: customer.country,
            },
          },
        });
      } else {
        // Create new customer
        stripeCustomer = await stripe.customers.create({
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          shipping: {
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone,
            address: {
              line1: customer.address,
              city: customer.city,
              postal_code: customer.postalCode,
              country: customer.country,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error creating/updating customer:", error);
    }

    // Create payment intent with customer information
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      customer: stripeCustomer?.id,
      metadata: {
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        shippingAddress: `${customer.address}, ${customer.city}, ${customer.postalCode}, ${customer.country}`,
        products: productsList,
        // Limit the product data if it's too long for metadata
        productData: JSON.stringify(products).substring(0, 500),
        totalItems: products?.length || 0,
      },
      receipt_email: customer.email,
      shipping: stripeCustomer
        ? undefined
        : {
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone,
            address: {
              line1: customer.address,
              city: customer.city,
              postal_code: customer.postalCode,
              country: customer.country,
            },
          },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Internal Error:", error);

    return NextResponse.json(
      { error: { message: `Internal Error: ${error}` } },
      { status: 500 }
    );
  }
}
