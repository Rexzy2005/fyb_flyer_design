import { db } from '@/lib/db'
import { initiatePayment, verifyPayment } from '@/lib/payment'
import type { Payment, PaymentStatus, PaymentType } from '@prisma/client'

export interface CreatePaymentData {
  userId: string
  templateId: string
  amount: number
  type?: PaymentType
  userEmail?: string
}

export class PaymentService {
  static async create(data: CreatePaymentData): Promise<{ payment: Payment; reference: string }> {
    // Try to validate template exists, but don't fail if database is down
    try {
      const template = await db.template.findUnique({
        where: { id: data.templateId },
      })

      if (!template) {
        throw new Error(`Template with ID '${data.templateId}' not found`)
      }
    } catch (error: any) {
      // If database is down, log warning but continue
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Database unreachable, skipping template validation')
      } else {
        throw error
      }
    }

    // Initiate payment with Paystack
    const paymentResponse = await initiatePayment({
      userId: data.userId,
      templateId: data.templateId,
      amount: data.amount,
      userEmail: data.userEmail,
    })

    try {
      // Try to create payment record
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
    } catch (error: any) {
      // If database is down, return a mock payment object
      if (error?.message?.includes("Can't reach database")) {
        console.warn('⚠️ Using in-memory payment due to database unavailability')
        const mockPayment: Payment = {
          id: `temp-${Date.now()}`,
          userId: data.userId,
          templateId: data.templateId,
          amount: data.amount,
          type: data.type ?? 'DOWNLOAD',
          reference: paymentResponse.reference,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        return { payment: mockPayment, reference: paymentResponse.reference }
      }
      throw error
    }
  }

  static async verify(reference: string): Promise<Payment> {
    // Verify payment with Paystack
    const verification = await verifyPayment(reference)
    const status: PaymentStatus = verification.status === 'success' ? 'COMPLETED' : 'FAILED'

    const payment = await db.payment.findUnique({
      where: { reference },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    return db.payment.update({
      where: { id: payment.id },
      data: { status },
    })
  }

  // Fast verification - just mark as completed without re-verifying with Paystack
  // Used after Paystack onSuccess callback confirms payment
  static async markAsCompleted(reference: string): Promise<Payment> {
    const payment = await db.payment.findUnique({
      where: { reference },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    return db.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
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
