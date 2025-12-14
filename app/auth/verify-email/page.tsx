'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided. Please check your email for the correct verification link.')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const result = await response.json()

      if (result.success) {
        setStatus('success')
        setMessage('Your email has been verified successfully! You can now log in to your account.')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(result.error || 'Email verification failed. The link may have expired.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification. Please try again.')
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center py-8">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Verifying Your Email
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Email Verified!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <div className="space-y-3">
                  <Button onClick={() => router.push('/auth/login')} className="w-full">
                    Go to Login
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Redirecting automatically in 3 seconds...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Verification Failed
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Need help?</strong> Check your email for a new verification link, or contact support if the problem persists.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/auth/signup')}
                      className="flex-1"
                    >
                      Sign Up Again
                    </Button>
                    <Button onClick={() => router.push('/auth/login')} className="flex-1">
                      Go to Login
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

