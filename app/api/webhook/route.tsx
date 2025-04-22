import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import mongoose from 'mongoose';

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// POST handler for Stripe webhook events
export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  try {
    await connectDB();
    
    const payload = await req.text();
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Validate the webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle specific webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update order payment status
        if (session.metadata.orderId) {
          await Order.findByIdAndUpdate(
            session.metadata.orderId,
            { paymentStatus: 'paid' },
            { new: true }
          );
          console.log(`Order ${session.metadata.orderId} marked as paid`);
        }
        break;
        
      // Handle other event types as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
