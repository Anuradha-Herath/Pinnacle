import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import crypto from 'crypto';
import { sendEmail } from '@/lib/emailService';

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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please provide your email address' 
      }, { status: 400 });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Even if user is not found, return success for security
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'If your email is in our system, you will receive a password reset link shortly'
      });
    }
    
    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Token expires in 1 hour
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    
    // Save reset token and expiry to user document
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL - Get base URL from request to match the correct port
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetURL = `${protocol}://${host}/password-reset/${resetToken}`;
    
    // For development, log the reset URL to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetURL);
    }
    
    // Send email with reset link
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; ">Password Reset</h1>
            <p style="color: #333; font-size: 16px;">You requested a password reset for your Pinnacle account.</p>
            <p style="color: #333; font-size: 16px;">Click the button below to reset your password:</p>
            
            <div style=" margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block; border: 1px solid #000;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
    } catch (err) {
      // If email sending fails, clear the tokens
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Error sending password reset email:', err);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send password reset email' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'If your email is in our system, you will receive a password reset link shortly'
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process password reset request. Please try again later.'
    }, { status: 500 });
  }
}