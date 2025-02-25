import mongoose, { Schema } from 'mongoose';

// Define Gallery item schema
const GalleryItemSchema = new Schema({
  src: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
});

// Define main product schema
const ProductSchema = new Schema({
  productName: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  tag: { type: String },
  sizes: [{ type: String }],
  gallery: [GalleryItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if the model is already defined to prevent overwriting during hot reloads
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
