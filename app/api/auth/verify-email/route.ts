import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { setSession } from '@/lib/auth'
import { sendEmail } from '@/lib/mailer'
import { renderWelcomeEmail } from '@/emails/templates/welcome'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp, email } = body

    if (!otp || !email) {
      return NextResponse.json(
        { success: false, error: 'OTP code and email are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const user = await UserService.verifyEmail(otp, email)

    // Set session after successful verification
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Send welcome email (non-blocking for user)
    try {
      const html = renderWelcomeEmail({ username: user.username })
      await sendEmail({
        to: user.email,
        subject: 'Welcome to FYB Studio 🎉',
        html,
      })
    } catch (err: any) {
      console.error('Failed to send welcome email:', err?.message || err)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Email verification failed' },
      { status: 400 }
    )
  }
}
