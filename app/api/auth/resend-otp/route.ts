import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { sendEmail } from '@/lib/mailer'
import { renderEmailVerification } from '@/emails/templates/verify-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Resend OTP
    const otp = await UserService.resendOTP(email)

    // Get user for email
    const user = await UserService.findByEmail(email)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Send verification email with OTP
    let emailSent = false
    try {
      const emailHtml = renderEmailVerification({
        username: user.username,
        otp,
      })

      await sendEmail({
        to: user.email,
        subject: 'Your Verification Code - FYB Studio',
        html: emailHtml,
      })
      emailSent = true
      console.log('✅ Verification OTP resent to:', user.email)
    } catch (emailError: any) {
      console.error('Failed to send verification email:', emailError.message)
      
      // In development, return OTP in response
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'OTP code generated (development mode).',
          developmentOTP: otp,
        })
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'We could not send the verification email right now. Please try again in a few minutes.',
        },
        { status: 500 }
      )
    }

    const response: any = {
      success: true,
      message: 'OTP code has been resent to your email',
    }

    // In development, include OTP if email failed
    if (!emailSent && process.env.NODE_ENV === 'development') {
      response.developmentOTP = otp
      response.message = `Email not configured. OTP for testing: ${otp}`
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Failed to resend OTP:', error)
    return NextResponse.json(
      { success: false, error: 'We could not resend the OTP. Please try again.' },
      { status: 500 }
    )
  }
}

