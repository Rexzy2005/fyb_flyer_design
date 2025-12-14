import { prisma } from '@/lib/prisma'
import { initiatePayment, verifyPayment } from '@/lib/payment'
import type { Payment, PaymentStatus } from '@prisma/client'

export interface CreatePaymentData {
  userId: string
  templateId: string
  amount: number
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
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        templateId: data.templateId,
        amount: data.amount,
        reference: paymentResponse.reference,
        status: 'PENDING',
      },
    })

    return { payment, reference: paymentResponse.reference }
  }

  static async verify(reference: string): Promise<Payment> {
    // Verify payment (simulated)
    const verification = await verifyPayment(reference)

    const payment = await prisma.payment.findUnique({
      where: { reference },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Update payment status
    const status: PaymentStatus = verification.status === 'success' ? 'COMPLETED' : 'FAILED'

    return prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    })
  }

  static async findByReference(reference: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { reference },
      include: {
        user: true,
        template: true,
      },
    })
  }

  static async findByUser(userId: string): Promise<Payment[]> {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

