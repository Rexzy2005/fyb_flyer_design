// Paystack payment integration
import axios from 'axios'
import { getCurrentUser } from './current-user'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export interface PaymentInitiateRequest {
  userId: string
  templateId: string
  amount: number
  userEmail?: string
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
 * Initiate payment with Paystack
 */
export async function initiatePayment(
  request: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email: request.userEmail || 'customer@example.com',
        amount: request.amount * 100, // Convert to kobo
        reference: `FYB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    if (!response.data.status) {
      throw new Error('Failed to initialize payment with Paystack')
    }

    return {
      reference: response.data.data.reference,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
    }
  } catch (error: any) {
    console.error('Paystack payment initiation error:', error.response?.data || error.message)
    throw new Error(`Payment initiation failed: ${error.message}`)
  }
}

/**
 * Verify payment with Paystack
 */
export async function verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!response.data.status) {
      throw new Error('Failed to verify payment with Paystack')
    }

    const data = response.data.data
    const status = data.status === 'success' ? 'success' : 'failed'

    return {
      status,
      reference: data.reference,
      amount: data.amount / 100, // Convert from kobo to naira
    }
  } catch (error: any) {
    console.error('Paystack payment verification error:', error.response?.data || error.message)
    throw new Error(`Payment verification failed: ${error.message}`)
  }
}

