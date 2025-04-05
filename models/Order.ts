import mongoose, { Schema, Document } from 'mongoose';

// Define OrderItem interface
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
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

// Define the Order document interface
export interface IOrder extends Document {
  user: mongoose.Schema.Types.ObjectId;
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
  pointsEarned: number; // Added field for loyalty points earned
  status: 'Processing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String, required: true },
        size: { type: String },
        color: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
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
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: 'Processing',
      enum: ['Processing', 'Out For Delivery', 'Delivered', 'Cancelled'],
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
