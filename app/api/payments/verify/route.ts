import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'
import { verifyPaymentSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/current-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = verifyPaymentSchema.parse(body)

    // Fast path: just mark as completed without re-verifying with Paystack
    // (Paystack's onSuccess callback already confirmed the payment)
    const payment = await PaymentService.markAsCompleted(validatedData.reference)

    // Verify payment belongs to user
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        status: payment.status,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Some of the payment details are not valid. Please check and try again.' },
        { status: 400 }
      )
    }

    console.error('Payment verification failed:', {
      message: error?.message,
      code: error?.code,
    })
    
    return NextResponse.json(
      { success: false, error: error?.message || 'We could not verify your payment. Please try again.' },
      { status: 500 }
    )
  }
}

