interface DownloadSuccessProps {
  username: string
  templateName: string
  downloadUrl: string
}

export function renderDownloadSuccess({ username, templateName, downloadUrl }: DownloadSuccessProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Design is Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <div style="display: inline-block; width: 60px; height: 60px; background-color: #ffffff; border-radius: 12px; padding: 12px; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; color: #10b981;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Your Design is Ready!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${username},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                Great news! Your <strong>${templateName}</strong> design has been successfully generated and is ready for download.
              </p>
              
              <!-- Preview Image -->
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <img src="${downloadUrl}" alt="${templateName}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${downloadUrl}" download style="display: inline-block; padding: 16px 32px; background-color: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Download Your Design
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Your high-quality design is also available in your dashboard. You can download it anytime or share it with others.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                  <strong>💡 Tip:</strong> Save this email for future reference. You can always access your designs from your dashboard.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Need help? Contact us at <a href="mailto:support@fybuniversity.com" style="color: #0ea5e9; text-decoration: none;">support@fybuniversity.com</a>
              </p>
              <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} FYB University. All rights reserved.
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

