import mongoose, { Schema, model, models, Document } from 'mongoose';

interface ICoupon extends Document {
  product: string;
  price: number;
  discount: number;
  code: string;
  startDate: Date;
  endDate: Date;
  status: string;
  description?: string;
}

const CouponSchema = new Schema<ICoupon>(
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

const Coupon = models.Coupon || model<ICoupon>('Coupon', CouponSchema);
export default Coupon;