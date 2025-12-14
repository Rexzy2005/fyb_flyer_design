'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { CreditCard, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { simulateDelay } from '@/lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  templateName: string
  onSuccess: () => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  templateName,
  onSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!cardNumber || !cardName || !expiry || !cvv) {
      setError('Please fill in all fields')
      return
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Card number must be 16 digits')
      return
    }

    if (cvv.length !== 3) {
      setError('CVV must be 3 digits')
      return
    }

    // Simulate payment processing
    setStep('processing')
    await simulateDelay(2000)

    // Mock payment - 80% success rate
    const success = Math.random() > 0.2

    if (success) {
      setStep('success')
      await simulateDelay(1500)
      onSuccess()
      handleClose()
    } else {
      setStep('failed')
      setError('Payment failed. Please try again.')
    }
  }

  const handleClose = () => {
    setStep('form')
    setCardNumber('')
    setCardName('')
    setExpiry('')
    setCvv('')
    setError('')
    onClose()
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Complete Payment" size="md">
      {step === 'processing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing your payment...</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Input
              label="Cardholder Name"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                type="text"
                value={expiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (v.length <= 4) {
                    setExpiry(v.length === 4 ? `${v.slice(0, 2)}/${v.slice(2)}` : v)
                  }
                }}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
              <Input
                label="CVV"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                maxLength={3}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Pay {formatCurrency(amount)}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              This is a simulated payment. No real charges will be made.
            </p>
          </form>
        </div>
      )}
    </Modal>
  )
}

