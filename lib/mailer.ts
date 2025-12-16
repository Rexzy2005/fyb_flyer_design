import nodemailer from 'nodemailer'

// Check if email is configured
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

// Create transporter with better configuration
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. SMTP credentials missing.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  })
}

const transporter = createTransporter()

// Verify transporter connection
export async function verifyEmailConnection(): Promise<boolean> {
  if (!transporter || !isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Email not configured. OTP codes will be logged to console in development mode.')
    } else {
      console.warn('⚠️  Email not configured. Email sending will fail in production.')
    }
    return false
  }

  try {
    await transporter.verify()
    console.log('✅ Email server connection verified')
    return true
  } catch (error: any) {
    console.error('❌ Email server connection failed:', error.message)
    
    if (error.code === 'EAUTH') {
      console.error('💡 Tip: For Gmail, use an App Password, not your regular password.')
      console.error('   Visit: https://support.google.com/accounts/answer/185833')
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('💡 Tip: Check your SMTP_HOST and SMTP_PORT settings.')
    }
    
    return false
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // In development, if email is not configured, log to console
  if (!transporter || !isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 ===== EMAIL (DEVELOPMENT MODE - NOT SENT) =====')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('HTML:', options.html)
      console.log('==========================================\n')
      
      // Extract OTP from HTML for easy testing
      const otpMatch = options.html.match(/>(\d{6})</)
      if (otpMatch) {
        console.log(`🔑 OTP CODE: ${otpMatch[1]}`)
      }
      
      return // Don't throw error in development
    } else {
      throw new Error('Email service not configured. Please set SMTP credentials.')
    }
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `FYB Studio <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })
    console.log('✅ Email sent successfully to:', options.to)
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message)
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error(
        'Email authentication failed. Please check your SMTP credentials. ' +
        'For Gmail, make sure you\'re using an App Password, not your regular password. ' +
        'Visit: https://support.google.com/accounts/answer/185833'
      )
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      throw new Error(
        'Email server connection timeout. Please check your SMTP_HOST and SMTP_PORT settings, ' +
        'and ensure your network connection is stable.'
      )
    } else if (error.code === 'EENVELOPE') {
      throw new Error('Invalid email address. Please check the recipient email.')
    } else {
      throw new Error(`Email sending failed: ${error.message}`)
    }
  }
}

export { transporter }

