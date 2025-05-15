/**
 * Email service for sending password reset links
 * This is a development implementation that logs emails to console
 * In production, you would replace this with a real email provider
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    // Development mode - log the email details to console
    console.log('======= EMAIL WOULD BE SENT IN PRODUCTION =======');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('==================================================');

    // For development purposes, always return success
    return true;

    // In production, you would use a real email provider:
    /*
    // Example using SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'support@pinnacle.com' },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    });
    
    return response.ok;
    */
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

