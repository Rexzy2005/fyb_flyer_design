import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { verifyEmailSchema } from '@/lib/validations'
import { setSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Verify email
    const user = await UserService.verifyEmail(token)

    // Update session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

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

