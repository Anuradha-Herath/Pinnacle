/**
 * Utility for processing order confirmation emails from webhook events
 */

import { sendOrderConfirmationEmail } from "@/lib/orderEmailService";
import Order from "@/models/Order";
import connectDB from "@/lib/db";

export async function processOrderConfirmationEmail(orderNumber: string): Promise<void> {
  try {
    await connectDB();
    
    // Fetch order details from database using order number
    const orderData = await Order.findOne({ orderNumber: orderNumber });
    
    if (!orderData) {
      throw new Error(`Order not found with order number: ${orderNumber}`);
    }

    const orderDetails = {
      items: orderData.line_items.map((item: any) => ({
        name: item.price_data.product_data,
        quantity: item.quantity,
        price: item.price_data.unit_amount / 100,
        color: item.metadata?.color
          ? item.metadata.color.split("/").pop()?.split(".")[0]
          : undefined,
        size: item.metadata?.size,
        image: item.metadata?.imageUrl || null, // Include image URL
      })),
      subtotal: orderData.amount.subtotal,
      shippingCost: orderData.amount.shippingCost,
      total: orderData.amount.total,
      coupon: orderData.coupon?.code
        ? {
            code: orderData.coupon.code,
            discount: orderData.coupon.discount,
          }
        : undefined,
      deliveryMethod: orderData.shipping.deliveryMethod,
      address: orderData.shipping.address,
    };

    await sendOrderConfirmationEmail({
      customerEmail: orderData.customer.email,
      customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
      orderNumber: orderData.orderNumber,
      orderStatus: orderData.status,
      orderDetails,
    });

    console.log("Order confirmation email sent successfully");
  } catch (emailError) {
    console.error("Failed to send order confirmation email:", emailError);
    throw emailError; // Re-throw to allow webhook to handle the error
  }
}