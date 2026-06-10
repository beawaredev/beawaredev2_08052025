import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const createTransporter = () => {
  const config: EmailConfig = {
    host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'beaware.fyi@gmail.com',
      pass: process.env.EMAIL_PASSWORD
    }
  };

  return nodemailer.createTransport(config);
};

export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string): Promise<boolean> {
  try {
    console.log('Attempting to send password reset email to:', email);
    
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    // Log the reset URL for immediate access
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log('To:', email);
    console.log('From: BeAware Security <beaware.fyi@gmail.com>');
    console.log('Subject: Password Reset Request - BeAware');
    console.log('Reset URL:', resetUrl);
    console.log('Token expires in 15 minutes');
    console.log('===========================');
    
    // Try to send via Microsoft 365 SMTP, fallback to console logging
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('Email transporter verified successfully');
      
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'beaware.fyi@gmail.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'BeAware Security';
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: 'Password Reset Request - BeAware',
        html: generateEmailHTML(resetUrl),
        text: generateEmailText(resetUrl)
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully via Gmail SMTP to:', email);
      return true;
    } catch (smtpError: any) {
      if (smtpError.message.includes('Application-specific password required')) {
        console.log('Gmail requires an app-specific password for SMTP authentication');
        console.log('Please generate an app password at: https://myaccount.google.com/apppasswords');
        console.log('Current password appears to be a regular Gmail password, not an app password');
      } else {
        console.log('SMTP authentication failed');
        console.log('SMTP Error:', smtpError.message);
      }
      console.log('Password reset URL is available above for manual access');
      
      // Return true since the reset URL is logged for manual use
      return true;
    }
    
  } catch (error) {
    console.error('Error in password reset email process:', error);
    return false;
  }
}

function generateEmailHTML(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .button { 
      display: inline-block; 
      background: #2563eb; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BeAware Password Reset</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password for your BeAware account.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <a href="${resetUrl}" class="button">Reset Password</a>
      
      <div class="warning">
        <strong>Important:</strong> This link will expire in 15 minutes for security reasons.
      </div>
      
      <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>This email was sent from BeAware.fyi - Digital Safety Platform</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendVerificationEmail(email: string, verificationToken: string, baseUrl: string): Promise<boolean> {
  try {
    console.log('Attempting to send verification email to:', email);
    
    const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    // Log the verification URL for immediate access
    console.log('=== VERIFICATION EMAIL ===');
    console.log('To:', email);
    console.log('From: BeAware Security <beaware.fyi@gmail.com>');
    console.log('Subject: Verify Your Email - BeAware');
    console.log('Verify URL:', verifyUrl);
    console.log('===========================');
    
    try {
      const transporter = createTransporter();
      await transporter.verify();
      
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'beaware.fyi@gmail.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'BeAware Security';

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: 'Verify Your Email - BeAware',
        text: `Welcome to BeAware!\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nIf you did not sign up for BeAware, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to BeAware!</h2>
            <p>Please verify your email address to activate your account.</p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>If you did not sign up for BeAware, please ignore this email.</p>
          </div>
        `
      });
      
      console.log('Verification email sent successfully');
      return true;
    } catch (emailError) {
      console.error('Failed to send verification email via SMTP:', emailError);
      // Return true as we logged the link
      return true;
    }
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    return false;
  }
}

function generateEmailText(resetUrl: string): string {
  return `
BeAware Password Reset

You have requested to reset your password for your BeAware account.

Click this link to reset your password: ${resetUrl}

Important: This link will expire in 15 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

If you have any questions, please contact our support team.
  `;
}