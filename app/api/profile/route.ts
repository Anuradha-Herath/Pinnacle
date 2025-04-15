import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/middleware/auth';
import mongoose from 'mongoose';
import User from '@/models/User';
import * as uuidModule from 'uuid';
const { v4: uuidv4 } = uuidModule;
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// GET - Get authenticated user's profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
      }, { status: 401 });
    }

    // Find user by ID
    const user = await User.findById(authResult.user?.id).select('-password');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Make sure profilePicture is never returned as /default-profile.png
    if (!user.profilePicture || user.profilePicture === '/default-profile.png') {
      user.profilePicture = '/p9.webp';
      // Save the updated default image path to prevent future 404s
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        points: user.points || 0,
        profilePicture: user.profilePicture, // This will now be either the user's actual picture or /p9.webp
        role: user.role,
        wishlist: user.wishlist || [],
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    }, { status: 500 });
  }
}

// PUT - Update authenticated user's profile
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const authResult = await authenticateUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required',
      }, { status: 401 });
    }

    // Parse the form data from the request
    const formData = await req.formData();
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    
    // Find user by ID
    const user = await User.findById(authResult.user?.id);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    // Handle profile picture upload using Cloudinary
    const profilePicture = formData.get('profilePicture') as File;
    if (profilePicture) {
      try {
        // Convert the file to base64 string for Cloudinary upload
        const bytes = await profilePicture.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = `data:${profilePicture.type};base64,${buffer.toString('base64')}`;
        
        // Create a unique folder path using userId to organize uploads
        const uploadPath = `pinnacle/profile_pictures/${user._id}`;
        
        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            base64Image,
            { 
              folder: uploadPath,
              public_id: `profile_${Date.now()}`, // Create unique name with timestamp
              overwrite: true,
              transformation: [
                { width: 500, height: 500, crop: 'limit' }, // Resize image
                { quality: 'auto:good' }                   // Optimize quality
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });
        
        // Store the Cloudinary URL in the user profile
        user.profilePicture = (uploadResponse as any).secure_url;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return NextResponse.json({
          success: false,
          error: 'Failed to upload profile picture',
        }, { status: 500 });
      }
    }

    // Save updated user
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        profilePicture: user.profilePicture,
        points: user.points || 0,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }, { status: 500 });
  }
}
