import { db } from '@/lib/db'
import { payments, users, templates, type Payment, type PaymentStatus } from '@/drizzle/schema'
import { initiatePayment, verifyPayment } from '@/lib/payment'
import { eq, desc } from 'drizzle-orm'

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
    const [payment] = await db
      .insert(payments)
      .values({
        userId: data.userId,
        templateId: data.templateId,
        amount: data.amount,
        reference: paymentResponse.reference,
        status: 'PENDING',
      })
      .returning()

    if (!payment) {
      throw new Error('Failed to create payment')
    }

    return { payment, reference: paymentResponse.reference }
  }

  static async verify(reference: string): Promise<Payment> {
    // Verify payment (simulated)
    const verification = await verifyPayment(reference)

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, reference))
      .limit(1)

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Update payment status
    const status: PaymentStatus = verification.status === 'success' ? 'COMPLETED' : 'FAILED'

    const [updated] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, payment.id))
      .returning()

    if (!updated) {
      throw new Error('Failed to update payment')
    }

    return updated
  }

  static async findByReference(reference: string): Promise<Payment | null> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, reference))
      .limit(1)

    return payment || null
  }

  static async findByUser(userId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
  }
}
