import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'
import { initiatePaymentSchema } from '@/lib/validations'
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
    const validatedData = initiatePaymentSchema.parse(body)

    const { payment, reference } = await PaymentService.create({
      userId: user.id,
      templateId: validatedData.templateId,
      amount: validatedData.amount,
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
      return NextResponse.json(
        { success: false, error: 'Some of the payment details are not valid. Please check and try again.' },
        { status: 400 }
      )
    }

    console.error('Payment initiation failed:', error)
    return NextResponse.json(
      { success: false, error: 'We could not start your payment. Please try again.' },
      { status: 500 }
    )
  }
}

