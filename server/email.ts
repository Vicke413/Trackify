import { MailService } from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn("Warning: SENDGRID_API_KEY not found, email notifications will not work");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not set');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: 'notifications@trackify.com', // Update with your verified sender
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function sendPriceAlertEmail(
  userEmail: string, 
  productName: string, 
  currentPrice: string | number, 
  targetPrice: string | number,
  currency: string,
  productUrl: string
): Promise<boolean> {
  const subject = `Price Alert: ${productName} price has dropped!`;
  
  const numCurrentPrice = typeof currentPrice === 'string' ? parseFloat(currentPrice) : currentPrice;
  const numTargetPrice = typeof targetPrice === 'string' ? parseFloat(targetPrice) : targetPrice;
  
  // Format prices with currency
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  });
  
  const formattedCurrentPrice = formatter.format(numCurrentPrice);
  const formattedTargetPrice = formatter.format(numTargetPrice);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #3b82f6;">Price Drop Alert</h2>
      <p>Good news! The price for <strong>${productName}</strong> has dropped below your target price.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
        <p style="margin: 5px 0;"><strong>Current Price:</strong> <span style="color: #16a34a; font-weight: bold;">${formattedCurrentPrice}</span></p>
        <p style="margin: 5px 0;"><strong>Your Target Price:</strong> ${formattedTargetPrice}</p>
      </div>
      
      <p>Don't miss this opportunity! Visit the product page to take advantage of this deal:</p>
      
      <a href="${productUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 15px 0;">View Product</a>
      
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
        This is an automated notification from Trackify.<br>
        Track Smarter, Shop Better.
      </p>
    </div>
  `;
  
  const text = `
    Price Drop Alert!
    
    Good news! The price for ${productName} has dropped below your target price.
    
    Product: ${productName}
    Current Price: ${formattedCurrentPrice}
    Your Target Price: ${formattedTargetPrice}
    
    Don't miss this opportunity! Visit the product page to take advantage of this deal:
    ${productUrl}
    
    This is an automated notification from Trackify.
    Track Smarter, Shop Better.
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
}