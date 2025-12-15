import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { registerSchema } from '@/lib/validations'
import { setSession } from '@/lib/auth'
import { sendEmail } from '@/lib/mailer'
import { renderEmailVerification } from '@/emails/templates/verify-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Register user (saves to database via Prisma)
    const { user, token } = await UserService.register(validatedData)

    // Verify user was saved to database
    const savedUser = await UserService.findByEmail(user.email)
    if (!savedUser) {
      console.error('User registration failed: User not found in database after creation')
      return NextResponse.json(
        { success: false, error: 'Registration failed. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful database save
    console.log('✅ User successfully saved to database:', {
      id: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    })

    // Send verification email with OTP
    let emailSent = false
    let emailError: string | null = null
    
    try {
      const emailHtml = renderEmailVerification({
        username: savedUser.username,
        otp: token, // token is now a 6-digit OTP
      })

      await sendEmail({
        to: savedUser.email,
        subject: 'Verify Your Email - FYB University',
        html: emailHtml,
      })
      emailSent = true
      console.log('✅ Verification OTP sent to:', savedUser.email)
    } catch (err: any) {
      emailError = err.message || 'Failed to send email'
      console.error('Failed to send verification email:', err.message)
      // Don't fail registration if email fails - user is still saved to database
      // In development, OTP is logged to console
    }

    // Don't set session yet - user must verify email first
    // Session will be set after email verification

    // Return success response with user data from database
    const response: any = {
      success: true,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        role: savedUser.role,
        department: savedUser.department,
        isVerified: savedUser.isVerified,
      },
      message: emailSent
        ? 'Registration successful. Please check your email for the OTP code to verify your account.'
        : 'Registration successful. However, we could not send the verification email. Please contact support.',
      otpSent: emailSent,
    }

    // In development, include OTP in response if email failed
    if (!emailSent && process.env.NODE_ENV === 'development') {
      response.developmentOTP = token
      response.message = `Registration successful. Email not configured. OTP for testing: ${token}`
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error.message?.includes('Database connection failed') || error.message?.includes("Can't reach database server")) {
      console.error('❌ Database connection error during registration:', error.message)
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please try again in a moment. If the problem persists, contact support.',
          code: 'DATABASE_ERROR',
        },
        { status: 503 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}

