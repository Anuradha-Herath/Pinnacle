import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  title: string;
  description: string;
  priceRange: string;
  thumbnailImage: string;
  mainCategory: string[]; // Changed from string to array of strings
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
    mainCategory: {
      type: [String], // Changed to array of strings
      enum: ['Men', 'Women', 'Accessories'], // These are still the only valid values
      required: [true, 'Please select at least one main category'],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0; // Make sure at least one category is selected
        },
        message: 'Please select at least one main category'
      }
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Check if model already exists to prevent overwriting during hot reloads
export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
