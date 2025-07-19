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
    const adminParam = user.role === 'admin' ? '?from=admin' : '';
    const resetURL = `${protocol}://${host}/password-reset/${resetToken}${adminParam}`;
    
    // Determine if this is an admin request (check if request came from admin login page)
    const referer = request.headers.get('referer') || '';
    const isAdminRequest = referer.includes('/admin/adminlogin') || user.role === 'admin';
    
    // Set colors based on request type
    const primaryColor = isAdminRequest ? '#ff6b35' : '#000'; // Orange for admin, black for user
    const backgroundColor = isAdminRequest ? '#fff5f0' : '#f9f9f9'; // Light orange bg for admin, light gray for user
    
    // For development, log the reset URL to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetURL);
      console.log('Is admin request:', isAdminRequest);
    }
    
    // Send email with reset link
    try {
      await sendEmail({
        to: user.email,
        subject: `Password Reset Request${isAdminRequest ? ' - Admin Portal' : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${primaryColor}; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Password Reset Request${isAdminRequest ? ' - Admin Portal' : ''}</h1>
            </div>
            <div style="padding: 20px; background-color: ${backgroundColor};">
              <h2 style="color: #333;">Reset Your Password</h2>
              <p style="font-size: 16px; color: #666;">
                You requested a password reset for your Pinnacle ${isAdminRequest ? 'admin ' : ''}account. Click the button below to reset your password:
              </p>
              <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <a href="${resetURL}" 
                   style="background-color: ${primaryColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block; border: 1px solid ${primaryColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
              ${isAdminRequest ? `
              <div style="background-color: #fff2e6; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                <p style="font-size: 14px; color: #666; margin: 0;">
                  <strong>Admin Security Notice:</strong> This password reset was requested for an administrator account. If you did not request this, please contact IT support immediately.
                </p>
              </div>
              ` : ''}
              <p style="font-size: 12px; color: #999; margin-top: 30px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
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