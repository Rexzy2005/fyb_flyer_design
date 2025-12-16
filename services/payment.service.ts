import { db } from '@/lib/db'
import { initiatePayment, verifyPayment } from '@/lib/payment'
import type { Payment, PaymentStatus, PaymentType } from '@prisma/client'

export interface CreatePaymentData {
  userId: string
  templateId: string
  amount: number
  type?: PaymentType
}

export class PaymentService {
  static async create(data: CreatePaymentData): Promise<{ payment: Payment; reference: string }> {
    // Initiate payment (simulated)
    const paymentResponse = await initiatePayment({
      userId: data.userId,
      templateId: data.templateId,
      amount: data.amount,
    })

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: data.userId,
        templateId: data.templateId,
        amount: data.amount,
        type: data.type ?? 'DOWNLOAD',
        reference: paymentResponse.reference,
        status: 'PENDING',
      },
    })

    return { payment, reference: paymentResponse.reference }
  }

  static async verify(reference: string): Promise<Payment> {
    // Verify payment (simulated)
    const verification = await verifyPayment(reference)

    const payment = await db.payment.findUnique({
      where: { reference },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Update payment status
    const status: PaymentStatus = verification.status === 'success' ? 'COMPLETED' : 'FAILED'

    return db.payment.update({
      where: { id: payment.id },
      data: { status },
    })
  }

  static async findByReference(reference: string): Promise<Payment | null> {
    return db.payment.findUnique({
      where: { reference },
    })
  }

  static async findByUser(userId: string): Promise<Payment[]> {
    return db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
