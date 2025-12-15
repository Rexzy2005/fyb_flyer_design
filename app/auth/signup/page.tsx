'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card } from '@/components/ui/card'
import { validateEmail, validatePassword } from '@/lib/utils'
import { Mail } from 'lucide-react'

const departments = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Other',
]

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !username || !password || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          department: department || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle HTTP errors
        if (response.status === 503 || result.code === 'DATABASE_ERROR' || result.error?.includes('Database connection')) {
          setError(
            'Database connection failed. Your Render.com database may be paused. Please: 1) Go to dashboard.render.com, 2) Find your database, 3) Click "Resume" if paused, 4) Wait 2 minutes, then 5) Restart your dev server (Ctrl+C then npm run dev).'
          )
        } else {
          setError(result.error || `Registration failed (${response.status})`)
        }
        return
      }

      if (result.success) {
        // Verify user data was returned
        if (!result.user || !result.user.id) {
          setError('Registration completed but user data is missing. Please contact support.')
          return
        }

        // Update auth store with user data from database (not verified yet)
        useAuthStore.setState({
          user: {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            role: result.user.role as any,
            department: result.user.department,
            emailVerified: false, // Not verified yet
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: false, // Not authenticated until verified
        })

        console.log('User registered successfully and saved to database:', {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
        })

        // In development, log OTP if email is not configured
        if (result.developmentOTP) {
          console.log(`\n🔑 DEVELOPMENT MODE - OTP CODE: ${result.developmentOTP}\n`)
        }

        // Redirect to OTP verification page
        router.push(`/auth/verify-otp?email=${encodeURIComponent(result.user.email)}`)
      } else {
        setError(result.error || 'Signup failed')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              helperText="Must be at least 8 characters long"
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              helperText="Re-enter your password to confirm it matches"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department (Optional)
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {showVerificationMessage && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Verification Email Sent!
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      After verification, you'll be able to log in and access all features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={showVerificationMessage}>
              {showVerificationMessage ? 'Check Your Email' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

