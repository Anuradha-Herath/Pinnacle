/**
 * Order-specific email service for sending order confirmations and status updates
 */

import { sendEmail } from './emailService';

interface OrderEmailParams {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderStatus: string;
  orderDetails: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      color?: string;
      size?: string;
      image?: string; // Add image field
    }>;
    subtotal: number;
    shippingCost: number;
    total: number;
    coupon?: {
      code: string;
      discount: number;
    };
    deliveryMethod: string;
    address?: {
      address: string;
      city: string;
      district: string;
      postalCode: string;
    };
  };
}

export async function sendOrderConfirmationEmail({ 
  customerEmail, 
  customerName, 
  orderNumber, 
  orderStatus, 
  orderDetails 
}: OrderEmailParams): Promise<boolean> {
  const subject = `Order Confirmation - ${orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; align-items: center; }
        .item:last-child { border-bottom: none; }
        .item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px; }
        .item-details { flex: 1; }
        .item-price { text-align: right; font-weight: bold; }
        .total { font-weight: bold; font-size: 18px; color: #000; }
        .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        .status.paid { background-color: #dcfce7; color: #166534; }
        .status.processing { background-color: #fef3c7; color: #92400e; }
        .status.shipped { background-color: #dbeafe; color: #1d4ed8; }
        .status.delivered { background-color: #fed7aa; color: #c2410c; }
        .delivery-info { background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pinnacle</h1>
          <h2>Order Confirmation</h2>
        </div>
        
        <div class="content">
          <h3>Dear ${customerName},</h3>
          <p>Thank you for your order! Here are your order details:</p>
          
          <div class="order-details">
            <h4>Order Information</h4>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Status:</strong> <span class="status ${orderStatus.toLowerCase()}">${orderStatus}</span></p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h4>Items Ordered</h4>
            ${orderDetails.items.map(item => `
              <div class="item">
                ${item.image ? `
                  <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.style.display='none'">
                ` : `
                  <div style="width: 80px; height: 80px; background-color: #f3f4f6; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 12px;">No Image</div>
                `}
                <div class="item-details">
                  <strong>${item.name}</strong><br>
                  ${item.color ? `Color: ${item.color}<br>` : ''}
                  ${item.size ? `Size: ${item.size}<br>` : ''}
                  Quantity: ${item.quantity}
                </div>
                <div class="item-price">
                  $${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>$${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              ${orderDetails.coupon ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #059669;">
                  <span>Discount (${orderDetails.coupon.code} - ${orderDetails.coupon.discount}%):</span>
                  <span>-$${((orderDetails.subtotal * orderDetails.coupon.discount) / 100).toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Shipping:</span>
                <span>${orderDetails.shippingCost > 0 ? `$${orderDetails.shippingCost.toFixed(2)}` : 'Free'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;" class="total">
                <span>Total:</span>
                <span>$${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          ${orderStatus === 'Paid' ? `
            <div class="delivery-info">
              <h4 style="margin-top: 0; color: #0369a1;">📦 Delivery Information</h4>
              <p style="margin-bottom: 0;"><strong>Your order will be delivered within 2-5 business days!</strong></p>
              <p style="margin-bottom: 0; font-size: 14px; color: #475569;">We'll send you tracking information once your order ships.</p>
            </div>
          ` : ''}
          
          <div class="order-details">
            <h4>Shipping Information</h4>
            <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod === 'ship' ? 'Shipping' : 'Store Pickup'}</p>
            ${orderDetails.address ? `
              <p><strong>Shipping Address:</strong><br>
              ${orderDetails.address.address}<br>
              ${orderDetails.address.city}, ${orderDetails.address.postalCode}<br>
              ${orderDetails.address.district}</p>
            ` : `
              <p><strong>Pickup Location:</strong><br>
              Pinnacle Flagship Store<br>
              123 Fashion Avenue, Main Street<br>
              Open: Mon-Sat, 10:00 AM - 9:00 PM</p>
              ${orderStatus === 'Paid' ? `
                <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 10px; margin-top: 10px;">
                  <p style="margin: 0; color: #15803d;"><strong>Your order will be ready for pickup within 1-2 business days!</strong></p>
                </div>
              ` : ''}
            `}
          </div>
          
          ${orderStatus === 'Paid' ? `
            <p style="color: #059669; font-weight: bold;">✅ Your payment has been confirmed!</p>
          ` : ''}
          
          <p>If you have any questions about your order, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Pinnacle!</p>
          <p>© 2024 Pinnacle. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({ to: customerEmail, subject, html });
}

export async function sendOrderStatusUpdateEmail({ 
  customerEmail, 
  customerName, 
  orderNumber, 
  orderStatus 
}: Omit<OrderEmailParams, 'orderDetails'>): Promise<boolean> {
  const subject = `Order Status Update - ${orderNumber}`;
  
  const statusMessages = {
    'Paid': '✅ Your payment has been confirmed!',
    'Processing': '📦 Your order is being processed and will be ready soon!',
    'Shipped': '🚚 Your order has been shipped and is on its way!',
    'Processed': '✅ Your order has been processed and is ready for pickup!',
    'Delivered': '🎉 Your order has been delivered! Thank you for shopping with us!',
    'Refunded': '💰 Your order has been refunded. The amount will be credited back to your payment method.'
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .status-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .status { display: inline-block; padding: 12px 24px; border-radius: 25px; font-weight: bold; font-size: 18px; }
        .status.paid { background-color: #dcfce7; color: #166534; }
        .status.processing { background-color: #fef3c7; color: #92400e; }
        .status.shipped { background-color: #dbeafe; color: #1d4ed8; }
        .status.processed { background-color: #e0e7ff; color: #3730a3; }
        .status.delivered { background-color: #fed7aa; color: #c2410c; }
        .status.refunded { background-color: #fecaca; color: #dc2626; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pinnacle</h1>
          <h2>Order Status Update</h2>
        </div>
        
        <div class="content">
          <h3>Dear ${customerName},</h3>
          <p>We wanted to update you on the status of your order:</p>
          
          <div class="status-box">
            <h4>Order #${orderNumber}</h4>
            <div class="status ${orderStatus.toLowerCase()}">${orderStatus}</div>
            <p style="margin-top: 20px; font-size: 16px;">
              ${statusMessages[orderStatus as keyof typeof statusMessages] || 'Your order status has been updated.'}
            </p>
          </div>
          
          <p>You can track your order status anytime by logging into your account on our website.</p>
          <p>If you have any questions, please don't hesitate to contact our customer service team.</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Pinnacle!</p>
          <p>© 2024 Pinnacle. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({ to: customerEmail, subject, html });
}
