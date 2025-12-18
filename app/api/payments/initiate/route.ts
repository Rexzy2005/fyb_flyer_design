import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'
import { initiatePaymentSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/current-user'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentUser()
    
    // If database is unavailable, use session as fallback
    if (!user) {
      const session = await getSession()
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      // Use session data as fallback
      user = {
        id: session.userId,
        email: session.email,
      } as any
      console.warn('⚠️ Using session fallback - database may be unavailable')
    }

    // Ensure user is not null at this point
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = initiatePaymentSchema.parse(body)

    const { payment, reference } = await PaymentService.create({
      userId: user.id,
      templateId: validatedData.templateId,
      amount: validatedData.amount,
      userEmail: user.email,
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
      },
      reference,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { success: false, error: 'Some of the payment details are not valid. Please check and try again.', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment initiation failed:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    
    return NextResponse.json(
      { success: false, error: error?.message || 'We could not start your payment. Please try again.' },
      { status: 500 }
    )
  }
}

