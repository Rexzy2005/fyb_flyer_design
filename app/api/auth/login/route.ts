import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user.service'
import { loginSchema } from '@/lib/validations'
import { setSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Login user
    const user = await UserService.login(validatedData)

    // Set session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        department: user.department,
        isVerified: user.isVerified,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 401 }
    )
  }
}

