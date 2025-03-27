import mongoose, { Schema } from 'mongoose';

const DiscountSchema = new Schema({
  product: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Category', 'Sub-category', 'Product', 'All']
  },
  percentage: {
    type: Number,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Future Plan']
  },
  description: {
    type: String,
    default: ''
  },
  applyToAllProducts: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Check if model is already defined to avoid overwrite errors
const Discount = mongoose.models.Discount || mongoose.model('Discount', DiscountSchema);

export default Discount;
