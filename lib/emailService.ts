/**
 * Email service for sending password reset links using Gmail SMTP
 */

import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password (not regular password)
      }
    });

    console.log(`Attempting to send email to: ${to}`);

    // Send email
    const info = await transporter.sendMail({
      from: `"Pinnacle" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', info.messageId);
    return true;

  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

