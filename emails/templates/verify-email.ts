interface VerifyEmailProps {
  username: string
  otp: string
}

export function renderEmailVerification({ username, otp }: VerifyEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 8px 8px 0 0;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: #ffffff; border-radius: 12px; padding: 12px; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; color: #0ea5e9;">FYB</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to FYB Studio!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${username},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                Thank you for joining FYB Studio! We're excited to have you on board. To get started, please verify your email address using the OTP code below.
              </p>
              
              <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 2px dashed #0ea5e9;">
                <p style="margin: 0 0 15px; font-size: 14px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  Your Verification Code
                </p>
                <div style="display: inline-block; padding: 20px 40px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <p style="margin: 0; font-size: 48px; font-weight: 700; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${otp}
                  </p>
                </div>
                <p style="margin: 20px 0 0; font-size: 12px; color: #6b7280;">
                  Enter this code on the verification page to complete your registration
                </p>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                <strong>Important:</strong> This OTP code will expire in 10 minutes. If you didn't create an account with FYB Studio, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Best regards,<br>
                <strong style="color: #0ea5e9;">The FYB Studio Team</strong>
              </p>
              <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} FYB Studio. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

