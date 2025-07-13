import mongoose, { Schema } from "mongoose";

// Schema for line items in the order
const LineItemSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
  },
  price_data: {
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    product_data: {
      type: String,
      required: true,
    },
    unit_amount: {
      type: Number,
      required: true,
    },
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  metadata: {
    productId: String,
    color: String,
    size: String,
    imageUrl: String,
  },
});

// Main Order schema
const OrderSchema = new Schema({
  userId: {
      type: String,
      required: true,
    },
  // Customer information
  customer: {
    email: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    emailOffers: {
      type: Boolean,
      default: false,
    },
  },

  // Shipping information
  shipping: {
    deliveryMethod: {
      type: String,
      enum: ["ship", "pickup"],
      required: true,
    },
    address: {
      district: String,
      address: String,
      city: String,
      postalCode: String,
    },
  },

  // Order items
  line_items: [LineItemSchema],

  // Order totals
  amount: {
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },

  // Order status
  status: {
    type: String,
    enum: ["pending", "Paid" ,"Processing", "Shipped","Processed", "Delivered"],
    default: "pending",
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },

  // Coupon code
  coupon: {
    code: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: null,
    },
  },

  // Stripe customer ID
  metadata: {
    customerId: {
      type: String,
      required: true,
    },
  },

  // Order identifier
  orderNumber: {
    type: String,
    unique: true,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to generate order number if not provided
OrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Create and export the Order model
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;
