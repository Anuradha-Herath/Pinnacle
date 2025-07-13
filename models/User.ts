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
  points: number; // Ensure this is required in the interface
  profilePicture: string; // Add this field for profile picture URL
  phone?: string; // Add phone field
  address?: string; // Add address field
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  passwordResetToken?: string; // Add password reset token field
  passwordResetExpires?: Date; // Add password reset expires field
  stripeCustomerId: string | null; // Add this field for Stripe customer ID
  provider?: string; // Add provider field for social logins
  loginAttempts: number; // Add field for tracking login attempts
  lockUntil: number | null; // Add field for account lockout timestamp
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  isLocked: () => boolean; // Method to check if account is locked
  incrementLoginAttempts: () => Promise<void>; // Method to increment failed attempts
  resetLoginAttempts: () => Promise<void>; // Method to reset attempts after successful login
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
      required: function(this: any) {
        return this.provider ? false : true;
      },
      minlength: 6,
      // Fix the validator to return only boolean
      validate: {
        validator: function(this: any, v: string | undefined): boolean {
          // Skip validation if using social login
          if (this.provider) return true;
          // Otherwise enforce minlength
          return v !== undefined && v.length >= 6;
        },
        message: 'Password must be at least 6 characters'
      }
    },
    stripeCustomerId: { type: String, default: null },
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
      min: 0, // Ensure points can't go below zero
    },
    
    profilePicture: {
      type: String,
      default: '/p9.webp' // Change from '/default-profile.png' to an existing image
    },
    
    phone: {
      type: String,
      required: false,
    },
    
    address: {
      type: String,
      required: false,
    },
    
    resetPasswordToken: String,
    resetPasswordExpires: Number,
    
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    
    // Add provider field (optional)
    provider: {
      type: String,
      required: false,
    },
    
    // Add fields for account lockout
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Number,
      default: null
    },
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

// Method to compare password - with proper error handling for potential undefined passwords
UserSchema.methods.comparePassword = async function(this: any, candidatePassword: string): Promise<boolean> {
  try {
    // Handle case where password might not exist (social logins)
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Add method to check if account is locked
UserSchema.methods.isLocked = function(): boolean {
  // Check if account is locked (lockUntil is in the future)
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Add method to increment login attempts
UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // If lock has expired, reset attempts and remove lock
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
    await this.save();
    return;
  }
  
  // Otherwise increment attempts
  this.loginAttempts += 1;
  
  // Lock the account if too many attempts (5)
  if (this.loginAttempts >= 5) {
    // Lock for 30 minutes
    this.lockUntil = Date.now() + (30 * 60 * 1000);
  }
  
  await this.save();
};

// Add method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Create or get User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


