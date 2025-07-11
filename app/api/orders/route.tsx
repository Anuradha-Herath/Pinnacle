import Order from "@/models/Order";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { authenticateUser } from "@/middleware/auth";
import { getOrCreateStripeCustomer } from "@/lib/stripeHelpers";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const count = searchParams.get('count') === 'true';
    const fields = searchParams.get('fields')?.split(',').join(' ');
    
    // Build query object
    const query: any = {};
    
    // Add date filter if both dates are provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    
    console.log("Query for orders:", JSON.stringify(query));
    
    // If count parameter is true, just return the count
    if (count) {
      const totalCount = await Order.countDocuments();
      const filteredCount = Object.keys(query).length ? await Order.countDocuments(query) : totalCount;
      return NextResponse.json({ totalCount, filteredCount }, { status: 200 });
    }
    
    // Build the query
    let ordersQuery = Order.find(query);
    
    // Add field selection if specified, but always include critical fields
    if (fields) {
      // Make sure critical fields are always included
      const criticalFields = '_id orderNumber createdAt customer amount status paymentStatus';
      const allFields = `${fields} ${criticalFields}`.split(' ').filter((v, i, a) => a.indexOf(v) === i).join(' ');
      ordersQuery = ordersQuery.select(allFields);
    }
    
    // Add sorting
    ordersQuery = ordersQuery.sort({ createdAt: -1 });
    
    // Add limit if specified
    if (limit) {
      ordersQuery = ordersQuery.limit(limit);
    }
    
    // Execute query
    const orders = await ordersQuery.exec();
    
    // Validate the orders data
    if (!orders || !Array.isArray(orders)) {
      console.error("Orders is not an array:", orders);
      return NextResponse.json({ error: "Invalid order data returned" }, { status: 500 });
    }
    
    // Log the first order structure for debugging
    if (orders.length > 0) {
      console.log("Sample order structure:", JSON.stringify(orders[0], null, 2));
    }
    
    console.log(`Successfully retrieved ${orders.length} orders`);
    
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    if (!requestBody) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Please log in to complete your purchase",
        },
        { status: 401 }
      );
    }
    if (!authResult.user || !authResult.user.email) {
      return NextResponse.json(
        { error: "Authenticated user email not found" },
        { status: 400 }
      );
    }

    // Validating required fields
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

    // Validating shipping address if needed
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

    let simpleLineItems;
    const subtotal = requestBody.cart.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    if (
      requestBody.coupon?.code &&
      requestBody.coupon?.discount > 0
    ) {
      // apply only if coupon code and discount > 0 
      const totalDiscount = subtotal * (requestBody.coupon.discount / 100);

      simpleLineItems = requestBody.cart.map((item: any) => {
        const itemTotal = item.price * item.quantity;
        const itemShare = itemTotal / subtotal;
        const itemDiscountTotal = totalDiscount * itemShare;
        const discountedItemTotal = itemTotal - itemDiscountTotal;
        const discountedUnitAmount = Math.round(
          (discountedItemTotal / item.quantity) * 100
        );

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
            ? `${item.name} (${productDetails.join(", ")})`
            : item.name;

        const imageUrl = item.image || "";

        return {
          quantity: item.quantity,
          price_data: {
            currency: "USD",
            product_data: fullProductName, 
            unit_amount: discountedUnitAmount,
          },
          metadata: {
            productId: item.id,
            color: item.color || "N/A",
            size: item.size || "N/A",
            imageUrl: imageUrl,
          },
        };
      });
    } else {
      // No coupon or discount, use original prices
      simpleLineItems = requestBody.cart.map((item: any) => {
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
    }
    // --- END OF CHANGED PART ---

    const stripeCustomerId = await getOrCreateStripeCustomer(
      authResult.user?.email || requestBody.email,
      `${requestBody.firstName} ${requestBody.lastName}`,
      requestBody.phone
    );

    console.log("userid from authResult:", authResult.user?.id);
    // cus_SMPYF4aROqisDP
    const orderData = {
      userId: authResult.user?.id,
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
      coupon: {
        code: requestBody.coupon?.code || null,
        discount: requestBody.coupon?.discount || 0,
        description: requestBody.coupon?.description || null,
      },
      metadata: {
        customerId: stripeCustomerId,
      },
    };

    await connectDB();

    const newOrder = new Order(orderData);

    await newOrder.save();

    console.log("Order created with userId:", newOrder.userId);
    console.log(
      "Order created with stripeCustomerId:",
      newOrder.metadata.customerId
    );

    // Creating Stripe checkout session if Stripe is available
    let redirectUrl = "/payment";

    if (stripe) {
      try {
        // Formating line items for Stripe API requirements
        const stripeLineItems = simpleLineItems.map(
          (item: {
            price_data: { product_data: any; unit_amount: any };
            metadata: { imageUrl: any };
            quantity: any;
          }) => ({
            price_data: {
              currency: "USD",
              product_data: {
                name: item.price_data.product_data,
                images: [item.metadata.imageUrl].filter(Boolean),
              },
              unit_amount: item.price_data.unit_amount,
            },
            quantity: item.quantity,
          })
        );

        // Adding shipping cost line item if applicable
        if (requestBody.deliveryMethod === "ship") {
          stripeLineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Shipping Cost",
              },
              unit_amount: 1000,
            },
            quantity: 1,
          });
        }

        // Creating the Stripe session
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          payment_method_types: ["card"],
          line_items: stripeLineItems,
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?success=1&order=${newOrder.orderNumber}`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?canceled=1`,
          metadata: { orderId: newOrder._id.toString() },
        });

        // Stripe's checkout URL is put to redirectUrl
        redirectUrl = session.url;
      } catch (stripeError) {
        console.error("Stripe session creation failed:", stripeError);
      }
    } else {
      console.log("Skipping Stripe - not initialized");
    }

    return NextResponse.json({
      message: "Order created successfully",
      order: newOrder,
      redirect: redirectUrl,
      status: 200,
    });
  } catch (error) {
    console.error("General error in checkout:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
