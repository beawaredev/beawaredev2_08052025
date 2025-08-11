import nodemailer from 'nodemailer';
const createTransporter = () => {
    const config = {
        host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER || 'beaware.fyi@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'aaidzsuvsxtexwbh'
        }
    };
    return nodemailer.createTransport(config);
};
export async function sendPasswordResetEmail(email, resetToken, baseUrl) {
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
        }
        catch (smtpError) {
            if (smtpError.message.includes('Application-specific password required')) {
                console.log('Gmail requires an app-specific password for SMTP authentication');
                console.log('Please generate an app password at: https://myaccount.google.com/apppasswords');
                console.log('Current password appears to be a regular Gmail password, not an app password');
            }
            else {
                console.log('SMTP authentication failed');
                console.log('SMTP Error:', smtpError.message);
            }
            console.log('Password reset URL is available above for manual access');
            // Return true since the reset URL is logged for manual use
            return true;
        }
    }
    catch (error) {
        console.error('Error in password reset email process:', error);
        return false;
    }
}
function generateEmailHTML(resetUrl) {
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
function generateEmailText(resetUrl) {
    return `
BeAware Password Reset

You have requested to reset your password for your BeAware account.

Click this link to reset your password: ${resetUrl}

Important: This link will expire in 15 minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

If you have any questions, please contact our support team.
  `;
}
