// Payment service - Currently simulated, ready for Paystack integration

export interface PaymentInitiateRequest {
  userId: string
  templateId: string
  amount: number
}

export interface PaymentInitiateResponse {
  reference: string
  authorizationUrl: string
  accessCode: string
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed'
  reference: string
  amount: number
}

/**
 * Simulated payment initiation
 * In production, this would call Paystack API
 */
export async function initiatePayment(
  request: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  // Generate fake reference
  const reference = `FYB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Simulated response
  return {
    reference,
    authorizationUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/verify?reference=${reference}`,
    accessCode: `access_${reference}`,
  }
}

/**
 * Simulated payment verification
 * In production, this would verify with Paystack API
 */
export async function verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
  // Simulated verification - always succeeds for now
  // In production: await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {...})

  return {
    status: 'success',
    reference,
    amount: 0, // Will be set from database
  }
}

/**
 * Production Paystack integration (commented for future use)
 */
/*
import axios from 'axios'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export async function initiatePaymentPaystack(
  request: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email: request.userEmail,
      amount: request.amount * 100, // Convert to kobo
      reference: `FYB_${Date.now()}`,
      metadata: {
        userId: request.userId,
        templateId: request.templateId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return {
    reference: response.data.data.reference,
    authorizationUrl: response.data.data.authorization_url,
    accessCode: response.data.data.access_code,
  }
}

export async function verifyPaymentPaystack(reference: string): Promise<PaymentVerifyResponse> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  return {
    status: response.data.data.status === 'success' ? 'success' : 'failed',
    reference: response.data.data.reference,
    amount: response.data.data.amount / 100, // Convert from kobo
  }
}
*/

