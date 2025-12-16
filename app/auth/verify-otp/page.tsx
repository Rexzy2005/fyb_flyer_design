'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const { user } = useAuthStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [emailInput, setEmailInput] = useState(email || user?.email || '')
  const [status, setStatus] = useState<'input' | 'loading' | 'success' | 'error'>('input')
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (user?.isVerified) {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    if (!/^\d*$/.test(value)) return // Only allow numbers

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      // Focus last input
      document.getElementById(`otp-5`)?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP code')
      return
    }

    if (!emailInput) {
      setError('Please enter your email address')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode, email: emailInput }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus('success')
        // Update auth store
        useAuthStore.setState({
          user: {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            role: result.user.role as any,
            department: result.user.department,
            emailVerified: result.user.isVerified,
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
        })
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setStatus('error')
        setError(result.error || 'Verification failed')
        setOtp(['', '', '', '', '', ''])
        document.getElementById('otp-0')?.focus()
      }
    } catch (err: any) {
      setStatus('error')
      setError('Network error. Please try again.')
      setOtp(['', '', '', '', '', ''])
    }
  }

  const handleResendOTP = async () => {
    if (!emailInput) {
      setError('Please enter your email address first')
      return
    }

    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })

      const result = await response.json()

      if (result.success) {
        setError('')
        setResendCooldown(60) // 60 second cooldown
        setOtp(['', '', '', '', '', ''])
        document.getElementById('otp-0')?.focus()
        
        // In development, show OTP if email is not configured
        if (result.developmentOTP) {
          setError(`Development Mode: Email not configured. Use OTP: ${result.developmentOTP}`)
        }
      } else {
        setError(result.error || 'Failed to resend OTP')
      }
    } catch (err: any) {
      setError('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center py-8">
            {status === 'input' && (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                    <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Verify Your Email
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter the 6-digit OTP code sent to your email
                  </p>
                </div>

                <div className="space-y-6">
                  {!email && (
                    <Input
                      label="Email Address"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  )}

                  {email && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Verification code sent to:
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{email}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                      Enter OTP Code
                    </label>
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <Button onClick={handleVerify} className="w-full" size="lg">
                    Verify Email
                  </Button>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Didn&apos;t receive the code?
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleResendOTP}
                      disabled={isResending || resendCooldown > 0}
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend OTP (${resendCooldown}s)`
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend OTP
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            )}

            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Verifying...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your code</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email Verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your email has been successfully verified. Redirecting to dashboard...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <Button onClick={() => setStatus('input')} variant="outline">
                  Try Again
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

