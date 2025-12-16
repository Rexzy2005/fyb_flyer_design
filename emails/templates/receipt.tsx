interface ReceiptProps {
  username: string
  amount: number
  reference: string
  date: string
  templateName: string
}

export function renderReceipt({ username, amount, reference, date, templateName }: ReceiptProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Payment Receipt</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Hi ${username},</p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #374151;">
                Thank you for your purchase! Here's your payment receipt:
              </p>
              
              <!-- Receipt Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Template:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">${templateName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Amount:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right; font-weight: 600;">₦${amount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Reference:</td>
                        <td style="padding: 8px 0; font-size: 12px; color: #374151; text-align: right; font-family: monospace;">${reference}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #374151; text-align: right;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Status:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #10b981; text-align: right; font-weight: 600;">✓ Completed</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                  <strong>📧 Your design will be sent to your email shortly.</strong> You can also access it from your dashboard.
                </p>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Please keep this receipt for your records. If you have any questions about your purchase, feel free to contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Questions? Contact us at <a href="mailto:support@fybstudio.com" style="color: #0ea5e9; text-decoration: none;">support@fybstudio.com</a>
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

