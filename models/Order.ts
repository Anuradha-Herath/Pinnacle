import mongoose, { Schema, Document } from 'mongoose';

// Define OrderItem interface with expanded metadata
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  // Additional metadata fields from alternative model
  metadata?: {
    additionalInfo?: string;
    customizations?: string;
  };
}

// Define shipping address interface
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Customer information for guest checkouts
export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingConsent?: boolean;
}

// Define the Order document interface
export interface IOrder extends Document {
  user?: mongoose.Schema.Types.ObjectId;  // Optional to allow guest checkout
  customer?: CustomerInfo;                // For guest checkout
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentResult?: {
    id: string;
    status: string;
    email_address?: string;
    update_time?: string;
  };
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  pointsEarned: number;
  orderNumber: string;  // Human-readable order ID
  deliveryMethod: 'shipping' | 'pickup';
  status: 'Processing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    // User reference (if logged in)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,  // Not required to support guest checkout
    },
    
    // Customer info (for guest checkout)
    customer: {
      email: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      phone: { type: String },
      marketingConsent: { type: Boolean, default: false }
    },
    
    // Order items
    orderItems: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String, required: true },
        size: { type: String },
        color: { type: String },
        metadata: {
          additionalInfo: { type: String },
          customizations: { type: String }
        }
      },
    ],
    
    // Shipping information
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    
    // Delivery method
    deliveryMethod: {
      type: String,
      enum: ['shipping', 'pickup'],
      default: 'shipping',
    },
    
    // Payment details
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      email_address: { type: String },
      update_time: { type: String },
    },
    
    // Price breakdown
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    
    // Loyalty points
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Order number (human-readable ID)
    orderNumber: {
      type: String,
      unique: true,
    },
    
    // Order status
    status: {
      type: String,
      required: true,
      default: 'Processing',
      enum: ['Processing', 'Out For Delivery', 'Delivered', 'Cancelled'],
    },
    
    // Payment status
    paymentStatus: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'paid', 'failed', 'refunded'],
    },
    
    // Delivery date
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate order number if not provided
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    // Format: ORD-YYYYMMDD-XXXX (XXXX is a random 4-digit number)
    const date = new Date();
    const dateStr = date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    this.orderNumber = `ORD-${dateStr}-${randomStr}`;
  }
  next();
});

// Helper method to calculate points based on order total
OrderSchema.methods.calculatePoints = function(): number {
  return Math.round(this.totalPrice * 0.1); // 10% of total price
};

// Method to update order status
OrderSchema.methods.updateStatus = async function(status: IOrder['status']): Promise<IOrder> {
  this.status = status;
  if (status === 'Delivered') {
    this.deliveredAt = new Date();
  }
  return this.save();
};

// Make sure we don't create duplicate models
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
