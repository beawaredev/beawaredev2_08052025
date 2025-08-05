# Email Configuration

The BeAware application uses environment variables for email configuration, making it flexible to work with different email providers.

## Required Environment Variables

### Basic SMTP Configuration
- `EMAIL_HOST` - SMTP server hostname (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_SECURE` - Use SSL/TLS (true/false, default: false for STARTTLS)
- `EMAIL_USER` - SMTP username/email address (default: beaware.fyi@gmail.com)
- `EMAIL_PASSWORD` - SMTP password or app password (configured)

### Email Appearance
- `EMAIL_FROM` - From email address (defaults to EMAIL_USER)
- `EMAIL_FROM_NAME` - Display name for sender (default: BeAware Security)

## Common Email Provider Settings

### Microsoft 365 / Outlook
```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

### Gmail
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### SendGrid
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

## Security Notes

1. For Microsoft 365, ensure SMTP authentication is enabled in your tenant
2. For Gmail, use App Passwords instead of your regular password
3. For SendGrid, use "apikey" as the username and your API key as the password
4. Store all credentials as environment variables, never hardcode them

## Testing Email Configuration

Run the test script to verify your email settings:
```bash
node test-email-direct.js
```

This will attempt to send a test email using your configured settings.