import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    console.log('Verification email request received:', { email, code });

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Email content
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f97316; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Admin Login Verification</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="font-size: 16px; color: #666;">
            You requested to login to the admin panel. Please use the following verification code to complete your login:
          </p>
          <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="font-size: 36px; color: #f97316; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p style="font-size: 14px; color: #666;">
            This code will expire in 60 seconds. If you did not request this verification, please ignore this email.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email using existing service
    console.log('Attempting to send verification email...');
    const emailSent = await sendEmail({
      to: email,
      subject: 'Admin Login Verification Code',
      html: emailHTML,
    });

    console.log('Email send result:', emailSent);

    if (emailSent) {
      return NextResponse.json(
        { success: true, message: 'Verification code sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification code' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.log('Error sending verification email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
