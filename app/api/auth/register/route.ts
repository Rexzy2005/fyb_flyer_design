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

    // Send verification email
    try {
      const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
      const emailHtml = renderEmailVerification({
        username: savedUser.username,
        verificationUrl,
      })

      await sendEmail({
        to: savedUser.email,
        subject: 'Verify Your Email - FYB University',
        html: emailHtml,
      })
      console.log('✅ Verification email sent to:', savedUser.email)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails - user is still saved to database
    }

    // Set session with verified database user
    await setSession({
      userId: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    })

    // Return success response with user data from database
    return NextResponse.json(
      {
        success: true,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          username: savedUser.username,
          role: savedUser.role,
          department: savedUser.department,
          isVerified: savedUser.isVerified,
        },
        message: 'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}

