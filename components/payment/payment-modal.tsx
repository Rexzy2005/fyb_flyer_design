'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  templateName: string
  templateId: string
  userEmail?: string
  onSuccess: (reference: string) => void
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  templateName,
  templateId,
  userEmail,
  onSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

  // Load Paystack script
  useEffect(() => {
    if (!window.PaystackPop) {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate templateId format
      if (!templateId || templateId.length === 0) {
        throw new Error('Template ID is missing')
      }

      console.log('Initiating payment with:', { templateId, amount })
      
      // Call backend to initiate payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: String(templateId).trim(),
          amount: Number(amount),
        }),
      })

      const data = await response.json()
      console.log('Payment response:', data)

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      console.log('Payment initiated successfully, reference:', data.reference)
      setStep('processing')

      // Use Paystack Pop with correct API
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: userEmail || 'user@example.com',
          amount: amount * 100, // Paystack uses kobo (cents)
          ref: data.reference,
          onClose: () => {
            console.log('Payment window closed')
            setStep('form')
          },
          onSuccess: (response: any) => {
            console.log('Paystack payment successful:', response)
            setStep('success')
            // Call the parent success handler immediately with the reference
            onSuccess(data.reference)
          },
        })
        handler.openIframe()
      } else {
        throw new Error('Paystack library not loaded')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment initiation failed')
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Payment" size="md">
      {step === 'processing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing your payment with Paystack...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Test Card: 4084084084084081 | Expiry: 12/25 | CVV: 123
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Your download will begin shortly.</p>
        </div>
      )}

      {step === 'failed' && (
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Payment Failed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => setStep('form')}>Try Again</Button>
        </div>
      )}

      {step === 'form' && (
        <div>
          <Card className="mb-6 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Template</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{templateName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
          </Card>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Test Card Details:</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Card: 4084084084084081</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Expiry: 12/25 (any future date)</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">CVV: 123 (any 3 digits)</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">OTP: 123456 (when prompted)</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              You will be redirected to Paystack for secure payment
            </p>
          </form>
        </div>
      )}
    </Modal>
  )
}

