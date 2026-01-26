interface EmailService {
  sendPasswordResetEmail(email: string, resetLink: string): Promise<{ success: boolean; error?: string }>;
}

// Custom email service implementation
const customEmailService: EmailService = {
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<{ success: boolean; error?: string }> {
    // For now, we'll use a simple approach with better email content
    // In production, you might want to use a service like SendGrid, Mailgun, or AWS SES
    
    try {
      // Create a custom email template that's less likely to be flagged as spam
      const emailSubject = 'TailorFlow - Password Reset Request';
      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #10b981;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #ffffff;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 0 0 8px 8px;
                }
                .button {
                    display: inline-block;
                    background-color: #10b981;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    margin-top: 20px;
                }
                .security-note {
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TailorFlow</h1>
                <p>Professional Tailoring Shop Management</p>
            </div>
            
            <div class="content">
                <h2>Password Reset Request</h2>
                
                <p>Hello,</p>
                
                <p>We received a request to reset the password for your TailorFlow account associated with this email address.</p>
                
                <p>If you didn't make this request, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                
                <div class="security-note">
                    <strong>Security Notice:</strong>
                    <ul>
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>Never share this link with anyone</li>
                        <li>Our team will never ask for your password via email</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
                    ${resetLink}
                </p>
                
                <p>Thank you for using TailorFlow!</p>
                
                <div class="footer">
                    <p>This is an automated message from TailorFlow. Please do not reply to this email.</p>
                    <p>If you need help, contact our support team at support@tailorflow.com</p>
                </div>
            </div>
        </body>
        </html>
      `;

      // Log the email content for debugging
      console.log('EmailService - Sending password reset email:', {
        to: email,
        subject: emailSubject,
        resetLink: resetLink
      });

      // For development/testing, we'll just log the reset link
      // In production, you would integrate with an email service
      console.log('Password Reset Link:', resetLink);
      console.log('Email Content Preview:', emailBody);

      // Return success for now
      // TODO: Integrate with actual email service (SendGrid, Mailgun, AWS SES, etc.)
      return { success: true };
      
    } catch (error) {
      console.error('EmailService - Error sending email:', error);
      return { success: false, error: 'Failed to send password reset email' };
    }
  }
};

export const emailService = customEmailService;
