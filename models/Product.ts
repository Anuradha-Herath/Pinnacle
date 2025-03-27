import mongoose, { Schema } from 'mongoose';

// Define Gallery item schema
const GalleryItemSchema = new Schema({
  src: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
});

// Define main product schema
const ProductSchema = new Schema({
  // Basic product information
  productName: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  tag: { type: String },
  sizes: [{ type: String }],
  gallery: [GalleryItemSchema],
  
  // Target audience fields
  targetAudience: { 
    type: String, 
    enum: ['Men', 'Women', 'Unisex'],
    default: 'Men' 
  },
  
  // Style and occasion fields
  occasions: [{ type: String }], // e.g., "Formal", "Casual", "Wedding", "Business", "Party"
  style: [{ type: String }],     // e.g., "Classic", "Modern", "Vintage", "Bohemian"
  season: [{ type: String }],    // e.g., "Summer", "Winter", "Spring", "Fall"
  
  // Sizing and fit information
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
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a pre-save hook to update the 'updatedAt' timestamp on every save
ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if the model is already defined to prevent overwriting during hot reloads
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;