import mongoose, { Schema } from 'mongoose';

// Define additional image schema - ensure it's simple and clear
const AdditionalImageSchema = new Schema({
  src: { type: String, required: true },
  name: { type: String, required: true },
});

// Define Gallery item schema with additional images
const GalleryItemSchema = new Schema({
  src: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  additionalImages: [AdditionalImageSchema], // Make sure this is an array
});

// Define main product schema
const ProductSchema = new Schema({
  productName: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  discountedPrice: { type: Number }, // Add discounted price field
  tag: { type: String },
  sizes: [{ type: String }],
  gallery: [GalleryItemSchema],
  
  // New fields for occasion-based shopping
  occasions: [{ type: String }], // e.g., "Formal", "Casual", "Wedding", "Business", "Party"
  style: [{ type: String }],     // e.g., "Classic", "Modern", "Vintage", "Bohemian"
  season: [{ type: String }],    // e.g., "Summer", "Winter", "Spring", "Fall"
  
  // Detailed sizing information
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
    }
  },
  
  sizeChartImage: { type: String }, // Add this field for the size chart image
  
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
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if the model is already defined to prevent overwriting during hot reloads
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
