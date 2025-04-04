import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define CartItem interface
interface CartItem {
  productId: string;
  name: string;      // Add name field
  price: number;     // Add price field
  image: string;     // Add image field
  quantity: number;
  size?: string;
  color?: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  wishlist: string[]; // Array of product IDs
  cart: CartItem[]; // Array of cart items
  points: number; // Added points field for loyalty program
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    
    // New fields for cart and wishlist
    wishlist: {
      type: [String],
      default: [],
    },
    cart: {
      type: [{
        productId: {
          type: String,
          required: true
        },
        name: {          // Add name field
          type: String,
          required: true
        },
        price: {         // Add price field
          type: Number,
          required: true
        },
        image: {         // Add image field
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        size: String,
        color: String
      }],
      default: []
    },
    
    points: {
      type: Number,
      default: 0,
    },
    
    resetPasswordToken: String,
    resetPasswordExpires: Number,
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create or get User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
