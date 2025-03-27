import mongoose, { Schema, model, models } from 'mongoose';

const CouponSchema = new Schema(
  {
    product: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const Coupon = models.Coupon || model('Coupon', CouponSchema);
export default Coupon;