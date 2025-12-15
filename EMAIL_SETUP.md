# Email Setup Guide - FYB University

## Overview

The application uses Nodemailer to send verification emails with OTP codes. This guide will help you configure email sending properly.

## Common Email Errors

### 1. "Invalid login: 535-5.7.8 Username and Password not accepted"

**Cause:** Incorrect SMTP credentials, especially with Gmail.

**Solution for Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password (not your regular Gmail password) in `SMTP_PASS`

**Solution for other providers:**
- Use your email provider's SMTP settings
- Ensure you're using the correct username and password
- Some providers require app-specific passwords

### 2. "Greeting never received" / "ETIMEDOUT"

**Cause:** Connection timeout or incorrect SMTP settings.

**Solutions:**
1. Check your `SMTP_HOST` and `SMTP_PORT` settings
2. Verify your network connection
3. Check if your firewall is blocking the connection
4. Try different ports:
   - Port 587 (TLS) - Recommended
   - Port 465 (SSL)
   - Port 25 (usually blocked by ISPs)

### 3. "Email service not configured"

**Cause:** Missing SMTP environment variables.

**Solution:** Ensure all these are set in your `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="FYB University <your-email@gmail.com>"
```

## Email Provider Settings

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="FYB University <your-email@gmail.com>"
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM="FYB University <your-email@outlook.com>"
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM="FYB University <your-email@yahoo.com>"
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="FYB University <noreply@yourdomain.com>"
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
SMTP_FROM="FYB University <noreply@yourdomain.com>"
```

## Development Mode

In development mode, if email is not configured:
- The OTP code will be logged to the console
- The OTP will be included in the API response (check browser console)
- Registration will still succeed (user is saved to database)
- You can manually enter the OTP from the console

## Testing Email Configuration

1. **Check Environment Variables:**
   ```bash
   # Make sure these are set
   echo $SMTP_HOST
   echo $SMTP_USER
   ```

2. **Test Connection:**
   The application will automatically verify the email connection on startup.

3. **Test Registration:**
   - Register a new user
   - Check your email inbox (and spam folder)
   - If email fails, check console for OTP in development mode

## Troubleshooting

### Email not sending but no error?
- Check spam/junk folder
- Verify `SMTP_FROM` is set correctly
- Check email provider's sending limits

### Still having issues?
1. Verify all environment variables are set correctly
2. Check email provider's documentation for SMTP settings
3. Try a different email provider (SendGrid, Mailgun are more reliable)
4. Check server logs for detailed error messages
5. Ensure your IP is not blocked by the email provider

## Security Notes

- Never commit `.env` file to version control
- Use app passwords, not regular passwords
- Rotate passwords regularly
- Use environment-specific email accounts for production

## Production Recommendations

For production, consider using:
- **SendGrid** - Reliable, good free tier
- **Mailgun** - Great for transactional emails
- **AWS SES** - Cost-effective for high volume
- **Postmark** - Excellent deliverability

These services are more reliable than Gmail/Outlook for production applications.

