import mongoose from 'mongoose';

// Add these new fields to your Product schema
const ProductSchema = new mongoose.Schema({
  // ...existing code...
  
  // Add detailed sizing information
  fitType: {
    type: String,
    enum: ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized', 'Tailored'],
    default: 'Regular Fit',
  },
  
  // Size chart specific to this product
  sizeChart: {
    type: Map,
    of: {
      chest: Number,
      waist: Number,
      hips: Number,
      length: Number,
      // Add any other measurements as needed
    }
  },
  
  // True to size indicator (-1: runs small, 0: true to size, 1: runs large)
  sizingTrend: {
    type: Number,
    min: -1,
    max: 1,
    default: 0
  },
  
  // Sizing notes for chatbot to use
  sizingNotes: {
    type: String,
    maxlength: 500
  },
  
  // ...existing code...
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);