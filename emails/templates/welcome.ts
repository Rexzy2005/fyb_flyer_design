interface WelcomeEmailProps {
  username: string
}

export function renderWelcomeEmail({ username }: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FYB Studio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 8px 8px 0 0;">
              <div style="display: inline-block; width: 56px; height: 56px; background-color: #ffffff; border-radius: 16px; padding: 10px; margin-bottom: 16px;">
                <span style="font-size: 26px; font-weight: 800; color: #0ea5e9;">FYB</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Welcome to FYB Studio, ${username}!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                We’re excited to have you in the FYB Studio family. Your account has been
                <strong>successfully verified</strong> and you’re ready to start creating stunning FYB and sign‑out flyers.
              </p>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #374151;">
                With FYB Studio you can:
              </p>

              <ul style="margin: 0 0 24px 20px; padding: 0; font-size: 14px; line-height: 1.7; color: #4b5563; text-align: left;">
                <li>Pick from beautiful, ready‑made templates for faces of the day, week, and sign‑out flyers.</li>
                <li>Customize colours, texts, and photos to match your department or squad.</li>
                <li>Download high‑quality PNG designs you can share on WhatsApp, Instagram, and beyond.</li>
              </ul>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/templates" style="display: inline-block; padding: 14px 28px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px;">
                  Start Designing
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you ever have questions or need help creating your perfect flyer, just reply to this email and our team will be happy to support you.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                With warm regards,<br>
                <strong style="color: #0ea5e9;">The FYB Studio Team</strong>
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
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


