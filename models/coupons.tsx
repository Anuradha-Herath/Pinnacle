import mongoose, { Schema, model, models } from 'mongoose';

const CouponSchema = new Schema(
  {
    product: { 
      type: String, 
      required: [true, 'Please provide a product name'],
      trim: true 
    },
    price: { 
      type: String, 
      required: [true, 'Please provide a price'] 
    },
    discount: { 
      type: String, 
      required: [true, 'Please provide a discount value'] 
    },
    code: { 
      type: String, 
      required: [true, 'Please provide a coupon code'], 
      unique: true,
      trim: true 
    },
    startDate: { 
      type: String, 
      required: [true, 'Please provide a start date'] 
    },
    endDate: { 
      type: String, 
      required: [true, 'Please provide an end date'] 
    },
    status: { 
      type: String, 
      required: [true, 'Please provide a status'],
      enum: ['Active', 'Inactive', 'Expired', 'Future'],
      default: 'Active'
    },
    description: { 
      type: String, 
      default: '' 
    },
    customerEligibility: {
      type: String,
      enum: ['new user', 'loyalty customers', 'all'],
      default: 'all',
    },
    limit: {
      type: String,
      default: '0',
    },
    oneTimeUse: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Coupon = models.Coupon || model('Coupon', CouponSchema);
export default Coupon;