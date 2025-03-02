import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a category title'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceRange: {
      type: String,
      trim: true,
    },
    thumbnailImage: {
      type: String,
      default: '', // Empty string if no image is uploaded
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Check if model already exists to prevent overwriting during hot reloads
export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
